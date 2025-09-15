import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { Server } from "socket.io";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "google-translate113.p.rapidapi.com";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "x-rapidapi-key", "x-rapidapi-host"] }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson?: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return (originalResJson as any).apply(this, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 200) logLine = logLine.slice(0, 199) + "…";
      log(logLine);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // health
  app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

  // explicit options for preflight
  app.options("*", cors());

  // detect-language proxy
  app.post("/api/v1/translator/detect-language", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const { text } = req.body || {};
    if (RAPIDAPI_KEY) {
      try {
        const r = await fetch(`https://${RAPIDAPI_HOST}/api/v1/translator/detect-language`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
          body: JSON.stringify({ text }),
        });
        const json = await r.json().catch(() => ({ error: "invalid-json" }));
        return res.status(r.status).json(json);
      } catch (err) {
        console.error("proxy detect-language failed:", err);
        return res.status(502).json({ error: "detect-language proxy error", detail: String(err) });
      }
    }
    return res.json({ source_lang_code: "auto", lang: "auto", language: "auto" });
  });

  // translate proxy
  app.post("/api/v1/translator/text", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const { text, from, to, source_lang, target_lang } = req.body || {};
    const payload = { text, from: from ?? source_lang ?? "auto", to: to ?? target_lang ?? "en" };
    if (RAPIDAPI_KEY) {
      try {
        const r = await fetch(`https://${RAPIDAPI_HOST}/api/v1/translator/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
          body: JSON.stringify(payload),
        });
        const textBody = await r.text().catch(() => "<no-body>");
        try {
          const json = JSON.parse(textBody);
          return res.status(r.status).json(json);
        } catch {
          return res.status(r.status).json({ trans: textBody });
        }
      } catch (err) {
        console.error("proxy translate failed:", err);
        return res.status(502).json({ error: "translate proxy error", detail: String(err) });
      }
    }
    return res.json({ translated_text: typeof text === "string" ? text : "", translated: typeof text === "string" ? text : "", text: typeof text === "string" ? text : "" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // HTTP + Socket.IO
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

  // Map<className, Map<userId, Set<socketId>>>
  const classUsers: Record<string, Map<string, Set<string>>> = {};
  // Map<socketId, { userId, className, fullName, idPhotoUrl }>
  const socketMeta: Map<string, { userId: string; className: string; fullName?: string; idPhotoUrl?: string }> = new Map();

  io.on("connection", (socket) => {
    console.log("✅ Client connected", socket.id);

    socket.on("joinRoom", ({ student_class, studentClass, fullName, userId, idPhotoUrl }) => {
      const rawClass = (student_class ?? studentClass ?? "") as string;
      const className = rawClass.trim();
      if (!className || !userId) {
        console.warn("joinRoom missing class or userId", { rawClass, userId });
        return;
      }

      socketMeta.set(socket.id, { userId, className, fullName, idPhotoUrl });
      socket.join(className);

      if (!classUsers[className]) classUsers[className] = new Map();
      if (!classUsers[className].has(userId)) classUsers[className].set(userId, new Set());
      classUsers[className].get(userId)!.add(socket.id);

      const users = Array.from(classUsers[className].entries()).map(([uId, sockets]) => ({
        userId: uId,
        sockets: Array.from(sockets),
        socketsCount: sockets.size,
        fullName: Array.from(socketMeta.values()).find((m) => m.userId === uId && m.className === className)?.fullName ?? "",
        idPhotoUrl: Array.from(socketMeta.values()).find((m) => m.userId === uId && m.className === className)?.idPhotoUrl ?? "",
        studentClass: className,
      }));

      io.to(className).emit("onlineUsers", users);
      io.to(className).emit("onlineCount", classUsers[className].size);

      console.log(`JOIN: ${fullName ?? userId} -> "${className}" (${classUsers[className].size} unique users)`);
    });

    socket.on("chatMessage", (msg) => {
      const rawClass = (msg.student_class ?? msg.studentClass ?? "") as string;
      const className = rawClass.trim();
      if (!className) {
        console.warn("chatMessage missing class", msg);
        return;
      }

      // attach idPhotoUrl from stored socket meta if available
      const meta = socketMeta.get(socket.id);
      const senderPhoto = meta?.idPhotoUrl ?? (msg as any).idPhotoUrl ?? undefined;

      const newMsg = { ...msg, id: socket.id + Date.now(), createdAt: new Date().toISOString(), idPhotoUrl: senderPhoto };
      io.to(className).emit("chatMessage", newMsg);
    });

    socket.on("disconnecting", () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const { userId, className, fullName } = meta;
        const m = classUsers[className];
        if (m && m.has(userId)) {
          const sockets = m.get(userId)!;
          sockets.delete(socket.id);
          if (sockets.size === 0) m.delete(userId);

          const users = Array.from((classUsers[className] || new Map()).entries()).map(([uId, sockets]) => ({
            userId: uId,
            sockets: Array.from(sockets),
            socketsCount: sockets.size,
            fullName: Array.from(socketMeta.values()).find((m) => m.userId === uId && m.className === className)?.fullName ?? "",
            idPhotoUrl: Array.from(socketMeta.values()).find((m) => m.userId === uId && m.className === className)?.idPhotoUrl ?? "",
            studentClass: className,
          }));

          io.to(className).emit("onlineUsers", users);
          io.to(className).emit("onlineCount", (classUsers[className] && classUsers[className].size) || 0);
          console.log(`LEAVE: ${fullName ?? userId} left "${className}"`);
        }
        socketMeta.delete(socket.id);
      }
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Client disconnected", socket.id);
    });
  });


  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`[express+socket.io] running on http://0.0.0.0:${port}`);
    console.log(RAPIDAPI_KEY ? "RapidAPI proxy enabled" : "RapidAPI proxy disabled (shim mode)");
  });
})();
