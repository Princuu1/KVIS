// server/routes.ts
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import http, { type Server } from "http";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import cookieParser from "cookie-parser";
import { initDB } from "./db";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";
import { sendFeedbackEmail, sendWelcomeEmail, type EmailSendResult } from "./emailService";

import {
  insertUserSchema,
  loginSchema,
  insertAttendanceSchema,
  insertCalendarEventSchema,
  insertExamSchema,
  insertSyllabusSchema,
  insertChatMessageSchema,
} from "@shared/schema";

const upload = multer({ dest: "uploads/" });
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Read a property that might be stored as snake_case (DB) or camelCase (mapped).
 */
function getField<T = any>(row: any, snake: string, camel: string): T | null {
  if (!row) return null;
  if (Object.prototype.hasOwnProperty.call(row, camel)) return row[camel] as T;
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake] as T;
  return null;
}

function mapUserRow(row: any) {
  if (!row) return null;
  const rawFace = getField<any>(row, "face_descriptor", "faceDescriptor");
  let faceDescriptor: number[] | null = null;
  if (rawFace != null) {
    if (typeof rawFace === "string") {
      try {
        faceDescriptor = JSON.parse(rawFace);
      } catch {
        faceDescriptor = null;
      }
    } else {
      faceDescriptor = rawFace;
    }
  }

  return {
    id: getField<string>(row, "id", "id"),
    collegeRollNo: getField<string>(row, "college_roll_no", "collegeRollNo"),
    fullName: getField<string>(row, "full_name", "fullName"),
    studentClass: getField<string>(row, "student_class", "studentClass"),
    studentPhone: getField<string>(row, "student_phone", "studentPhone"),
    parentPhone: getField<string>(row, "parent_phone", "parentPhone"),
    studentEmail: getField<string>(row, "student_email", "studentEmail"),
    parentEmail: getField<string>(row, "parent_email", "parentEmail"),
    idPhotoUrl: getField<string | null>(row, "id_photo_url", "idPhotoUrl"),
    faceDescriptor,
    isActive: getField<boolean | null>(row, "is_active", "isActive"),
    createdAt: getField<Date | null>(row, "created_at", "createdAt"),
  };
}

function mapAttendanceRow(row: any) {
  if (!row) return null;
  return {
    id: getField(row, "id", "id"),
    userId: getField(row, "user_id", "userId"),
    date: getField(row, "date", "date"),
    status: getField(row, "status", "status"),
    subject: getField(row, "subject", "subject"),
    reason: getField(row, "reason", "reason"),
    method: getField(row, "method", "method"),
    verified: getField(row, "verified", "verified"),
    location: getField(row, "location", "location"),
    latitude: getField(row, "latitude", "latitude"),
    longitude: getField(row, "longitude", "longitude"),
    createdAt: getField(row, "created_at", "createdAt"),
  };
}

function mapCalendarRow(row: any) {
  if (!row) return null;
  return {
    id: getField(row, "id", "id"),
    title: getField(row, "title", "title"),
    description: getField(row, "description", "description"),
    date: getField(row, "date", "date"),
    endDate: getField(row, "end_date", "endDate"),
    type: getField(row, "type", "type"),
    createdBy: getField(row, "created_by", "createdBy"),
    createdAt: getField(row, "created_at", "createdAt"),
  };
}

/** Extract token from cookie or Authorization header */
const extractToken = (req: Request) =>
  (req as any).cookies?.token ||
  (req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization!.split(" ")[1]
    : undefined);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize DB
  await initDB();

  const server = http.createServer(app);

  // Middlewares
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Auth middleware
  const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Access token required" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // ---------------- AUTH: register ----------------
  app.post("/api/auth/register", upload.single("idPhoto"), async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByRollNo(userData.collegeRollNo);
      if (existing) return res.status(400).json({ message: "Roll number exists" });

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const idPhotoUrl = req.file ? await storage.uploadIdPhotoFromFile(req.file.path, req.file.originalname) : userData.idPhotoUrl ?? null;

      const createdRow = await storage.createUser({
        ...userData,
        password: hashedPassword,
        idPhotoUrl,
      });

      // Send welcome email but don't fail registration if email fails
      let emailResponse: EmailSendResult = { success: false, error: undefined };
      try {
        emailResponse = await sendWelcomeEmail({
          studentName: userData.fullName,
          studentEmail: userData.studentEmail,
          parentEmail: userData.parentEmail,
          collegeRollNo: userData.collegeRollNo,
        });
      } catch (err) {
        emailResponse = { success: false, error: err };
      }

      return res.status(201).json({
        user: mapUserRow(createdRow),
        emailsSent: Boolean(emailResponse.success),
        emailError: emailResponse.success ? undefined : String(emailResponse.error ?? ""),
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      return res.status(400).json({ message: "Registration failed", error: err?.message ?? String(err) });
    }
  });

  // ---------------- AUTH: login/logout/me ----------------
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const userRow = await storage.getUserByRollNo(parsed.collegeRollNo);
      if (!userRow) return res.status(401).json({ message: "Invalid credentials" });

      const passwordFromDb = getField<string>(userRow, "password", "password");
      const valid = await bcrypt.compare(parsed.password, passwordFromDb ?? "");
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: getField<string>(userRow, "id", "id"), rollNo: parsed.collegeRollNo }, JWT_SECRET, { expiresIn: "24h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ user: mapUserRow(userRow) });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(400).json({ message: "Login failed", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = (req.user as any).userId;
      if (!uid) return res.status(401).json({ message: "Access token required" });

      const userRow = await storage.getUser(uid);
      if (!userRow) return res.status(404).json({ message: "User not found" });

      res.json({ user: mapUserRow(userRow) });
    } catch (err: any) {
      console.error("Get me error:", err);
      res.status(500).json({ message: "Failed to get user", error: err?.message ?? String(err) });
    }
  });

  // ---------------- PROFILE UPDATE ----------------
  app.put("/api/user/profile", authenticate, upload.single("idPhoto"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = (req.user as any).userId;
      if (!uid) return res.status(401).json({ message: "Unauthorized" });

      const {
        fullName,
        collegeRollNo,
        studentPhone,
        parentPhone,
        studentEmail,
        parentEmail,
        studentClass,
        currentPassword,
        newPassword,
      } = req.body ?? {};

      let idPhotoUrl: string | undefined;
      if (req.file) {
        idPhotoUrl = await storage.uploadIdPhotoFromFile(req.file.path, req.file.originalname);
      }

      const userRow = await storage.getUser(uid);
      if (!userRow) return res.status(404).json({ message: "User not found" });

      const updates: any = {};
      if (fullName !== undefined) updates.fullName = fullName;
      if (collegeRollNo !== undefined) updates.collegeRollNo = collegeRollNo;
      if (studentPhone !== undefined) updates.studentPhone = studentPhone;
      if (parentPhone !== undefined) updates.parentPhone = parentPhone;
      if (studentEmail !== undefined) updates.studentEmail = studentEmail;
      if (parentEmail !== undefined) updates.parentEmail = parentEmail;
      if (studentClass !== undefined) updates.studentClass = studentClass;
      if (idPhotoUrl) updates.idPhotoUrl = idPhotoUrl;

      if (currentPassword && newPassword) {
        const passwordFromDb = getField<string>(userRow, "password", "password");
        const valid = await bcrypt.compare(currentPassword, passwordFromDb ?? "");
        if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
        updates.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updates).length === 0) {
        const current = await storage.getUser(uid);
        if (!current) return res.status(404).json({ message: "User not found" });
        return res.json({ user: mapUserRow(current) });
      }

      const updated = await storage.updateUser(uid, updates);
      if (!updated) return res.status(500).json({ message: "Failed to update user" });

      return res.json({ user: mapUserRow(updated) });
    } catch (err: any) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Profile update failed", error: err?.message ?? String(err) });
    }
  });

  // ---------------- FEEDBACK ----------------
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      const { name, email, description } = req.body;
      if (!name || !email || !description) return res.status(400).json({ error: "Missing required fields" });

      let sendResult: EmailSendResult;
      try {
        sendResult = await sendFeedbackEmail({ name, email, description });
      } catch (err) {
        sendResult = { success: false, error: err };
      }

      if (!sendResult.success) {
        console.error("Feedback emails failed:", sendResult.error);
        return res.status(500).json({ error: "Failed to send feedback email", sendError: String(sendResult.error) });
      }

      return res.status(200).json({ message: "✅ Feedback submitted successfully! A confirmation email has been sent." });
    } catch (err) {
      console.error("Feedback route error:", err);
      return res.status(500).json({ error: "Failed to send feedback email" });
    }
  });

  // ---------------- CHAT (Socket.IO) ----------------
  const io = new SocketIOServer(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("Socket.IO client connected:", socket.id);

    socket.on("joinClass", ({ className, name }) => {
      socket.join(className);
      socket.data.name = name;
      socket.data.className = className;
      console.log(`${name} joined ${className}`);
    });

    socket.on("chatMessage", async (msg) => {
      try {
        // optional validation: use insertChatMessageSchema if needed
        await storage.createChatMessage({
          userId: socket.data.userId ?? null,
          message: msg,
          room: socket.data.className ?? "general",
        } as any);

        io.to(socket.data.className ?? "general").emit("chatMessage", { name: socket.data.name ?? "Unknown", message: msg });
      } catch (err) {
        console.error("chatMessage error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO client disconnected:", socket.id);
    });
  });

  // ---------------- ATTENDANCE ----------------
  app.get("/api/attendance", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const rows = await storage.getAttendanceRecords(
        (req.user as any).userId,
        startDate ? new Date(String(startDate)) : undefined,
        endDate ? new Date(String(endDate)) : undefined
      );
      res.json({ records: (rows || []).map(mapAttendanceRow) });
    } catch (err: any) {
      console.error("Get attendance failed:", err);
      res.status(500).json({ message: "Failed to get attendance records", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/attendance", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // prepare data and validate with schema
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        userId: (req.user as any).userId,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      });

      const created = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json({ record: mapAttendanceRow(created) });
    } catch (err: any) {
      console.error("Create attendance failed:", err);
      res.status(400).json({ message: "Failed to create attendance record", error: err?.message ?? String(err) });
    }
  });

  app.get("/api/attendance/stats", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getAttendanceStats((req.user as any).userId);
      res.json({ stats });
    } catch (err: any) {
      console.error("Get attendance stats failed:", err);
      res.status(500).json({ message: "Failed to get attendance stats", error: err?.message ?? String(err) });
    }
  });

  // ---------------- CALENDAR ----------------
  app.get("/api/calendar", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const rows = await storage.getCalendarEvents(
        startDate ? new Date(String(startDate)) : undefined,
        endDate ? new Date(String(endDate)) : undefined
      );
      res.json({ events: (rows || []).map(mapCalendarRow) });
    } catch (err: any) {
      console.error("Get calendar failed:", err);
      res.status(500).json({ message: "Failed to get calendar events", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/calendar", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventData = insertCalendarEventSchema.parse({
        ...req.body,
        createdBy: (req.user as any).userId,
        date: new Date(req.body.date),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      const created = await storage.createCalendarEvent(eventData);
      res.status(201).json({ event: mapCalendarRow(created) });
    } catch (err: any) {
      console.error("Create calendar failed:", err);
      res.status(400).json({ message: "Failed to create calendar event", error: err?.message ?? String(err) });
    }
  });

  // ---------------- EXAMS ----------------
  app.get("/api/exams", authenticate, async (_req, res) => {
    try {
      const exams = await storage.getExamSchedule();
      res.json({ exams });
    } catch (err: any) {
      console.error("Get exams failed:", err);
      res.status(500).json({ message: "Failed to get exams", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/exams", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const examData = insertExamSchema.parse({
        ...req.body,
        date: new Date(req.body.date),
      });
      const created = await storage.createExam(examData);
      res.status(201).json({ exam: created });
    } catch (err: any) {
      console.error("Create exam failed:", err);
      res.status(400).json({ message: "Failed to create exam", error: err?.message ?? String(err) });
    }
  });

  // ---------------- SYLLABUS ----------------
  app.get("/api/syllabus", authenticate, async (_req, res) => {
    try {
      const items = await storage.getSyllabus();
      res.json({ syllabus: items });
    } catch (err: any) {
      console.error("Get syllabus failed:", err);
      res.status(500).json({ message: "Failed to get syllabus", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/syllabus", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const syllabusData = insertSyllabusSchema.parse({
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });
      const created = await storage.createSyllabusItem(syllabusData);
      res.status(201).json({ item: created });
    } catch (err: any) {
      console.error("Create syllabus failed:", err);
      res.status(400).json({ message: "Failed to create syllabus item", error: err?.message ?? String(err) });
    }
  });

  // ---------------- FACE RECOGNITION (get/post) ----------------
  app.get("/api/user/face", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = (req.user as any).userId;
      if (!uid) return res.status(401).json({ message: "Unauthorized" });

      // prefer a specialized storage method if available
      if (typeof storage.getUserFaceDescriptor === "function") {
        const desc = await storage.getUserFaceDescriptor(uid);
        return res.json(desc ?? null);
      }

      const userRow = await storage.getUser(uid);
      if (!userRow) return res.status(404).json({ message: "User not found" });

      const mapped = mapUserRow(userRow);
      return res.json(mapped?.faceDescriptor ?? null);
    } catch (err: any) {
      console.error("Error fetching face descriptor:", err);
      res.status(500).json({ message: "Failed to fetch face descriptor", error: err?.message ?? String(err) });
    }
  });

  app.post("/api/user/face", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = (req.user as any).userId;
      if (!uid) return res.status(401).json({ message: "Unauthorized" });

      const { faceDescriptor } = req.body;
      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({ message: "Invalid face descriptor" });
      }

      if (typeof storage.updateUserFaceDescriptor === "function") {
        const updatedRow = await storage.updateUserFaceDescriptor(uid, faceDescriptor);
        if (!updatedRow) return res.status(500).json({ message: "Failed to update face descriptor" });
        const mapped = mapUserRow(updatedRow);
        return res.json({ success: true, faceDescriptor: mapped?.faceDescriptor ?? faceDescriptor });
      }

      const updated = await storage.updateUser(uid, { faceDescriptor });
      if (!updated) return res.status(500).json({ message: "Failed to update face descriptor" });
      const mapped = mapUserRow(updated);
      return res.json({ success: true, faceDescriptor: mapped?.faceDescriptor ?? faceDescriptor });
    } catch (err: any) {
      console.error("Error saving face descriptor:", err);
      res.status(500).json({ message: "Failed to save face descriptor", error: err?.message ?? String(err) });
    }
  });

  // ---------------- GENERIC ERROR HANDLER ----------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err?.status || 500).json({ message: err?.message || "Internal Server Error" });
  });

  return server;
}
