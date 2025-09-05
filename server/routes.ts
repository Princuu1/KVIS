import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertAttendanceSchema,
  insertCalendarEventSchema,
  insertExamSchema,
  insertSyllabusSchema,
  insertChatMessageSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const upload = multer({ dest: "uploads/" });

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          connectedClients.set(message.userId, ws);
        } else if (message.type === 'chat') {
          // Save message to storage
          const chatMessage = await storage.createChatMessage({
            userId: message.userId,
            message: message.text,
            room: message.room || 'general'
          });
          
          // Broadcast to all connected clients
          const broadcastData = JSON.stringify({
            type: 'chat',
            message: chatMessage
          });
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from connected clients
      for (const [userId, client] of connectedClients.entries()) {
        if (client === ws) {
          connectedClients.delete(userId);
          break;
        }
      }
    });
  });

  // Auth routes
  app.post("/api/auth/register", upload.single('idPhoto'), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByRollNo(userData.collegeRollNo);
      if (existingUser) {
        return res.status(400).json({ message: "User with this roll number already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        idPhotoUrl: req.file?.path || null,
      });

      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { collegeRollNo, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByRollNo(collegeRollNo);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, rollNo: user.collegeRollNo },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Set httpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: error.message });
    }
  });

  // Attendance routes
  app.get("/api/attendance", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const records = await storage.getAttendanceRecords(
        req.user.userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ records });
    } catch (error) {
      res.status(500).json({ message: "Failed to get attendance records", error: error.message });
    }
  });

  app.post("/api/attendance", authenticateToken, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        userId: req.user.userId,
        date: new Date(req.body.date || Date.now()),
      });
      
      const record = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json({ record });
    } catch (error) {
      res.status(400).json({ message: "Failed to create attendance record", error: error.message });
    }
  });

  app.get("/api/attendance/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getAttendanceStats(req.user.userId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to get attendance stats", error: error.message });
    }
  });

  // Calendar routes
  app.get("/api/calendar", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await storage.getCalendarEvents(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Failed to get calendar events", error: error.message });
    }
  });

  app.post("/api/calendar", authenticateToken, async (req, res) => {
    try {
      const eventData = insertCalendarEventSchema.parse({
        ...req.body,
        createdBy: req.user.userId,
        date: new Date(req.body.date),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      
      const event = await storage.createCalendarEvent(eventData);
      res.status(201).json({ event });
    } catch (error) {
      res.status(400).json({ message: "Failed to create calendar event", error: error.message });
    }
  });

  // Exam routes
  app.get("/api/exams", authenticateToken, async (req, res) => {
    try {
      const exams = await storage.getExamSchedule();
      res.json({ exams });
    } catch (error) {
      res.status(500).json({ message: "Failed to get exam schedule", error: error.message });
    }
  });

  app.post("/api/exams", authenticateToken, async (req, res) => {
    try {
      const examData = insertExamSchema.parse({
        ...req.body,
        date: new Date(req.body.date),
      });
      
      const exam = await storage.createExam(examData);
      res.status(201).json({ exam });
    } catch (error) {
      res.status(400).json({ message: "Failed to create exam", error: error.message });
    }
  });

  // Syllabus routes
  app.get("/api/syllabus", authenticateToken, async (req, res) => {
    try {
      const syllabus = await storage.getSyllabus();
      res.json({ syllabus });
    } catch (error) {
      res.status(500).json({ message: "Failed to get syllabus", error: error.message });
    }
  });

  app.post("/api/syllabus", authenticateToken, async (req, res) => {
    try {
      const syllabusData = insertSyllabusSchema.parse({
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });
      
      const item = await storage.createSyllabusItem(syllabusData);
      res.status(201).json({ item });
    } catch (error) {
      res.status(400).json({ message: "Failed to create syllabus item", error: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", authenticateToken, async (req, res) => {
    try {
      const { room = 'general', limit = 50 } = req.query;
      const messages = await storage.getChatMessages(room as string, parseInt(limit as string));
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat messages", error: error.message });
    }
  });

  // Face descriptor update route
  app.post("/api/user/face-descriptor", authenticateToken, async (req, res) => {
    try {
      const { faceDescriptor } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.userId, {
        faceDescriptor,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Face descriptor updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update face descriptor", error: error.message });
    }
  });

  // Webhook for external attendance marking
  app.post("/api/webhooks/attendance", async (req, res) => {
    try {
      const { collegeRollNo, status, subject, location } = req.body;
      
      const user = await storage.getUserByRollNo(collegeRollNo);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const record = await storage.createAttendanceRecord({
        userId: user.id,
        date: new Date(),
        status,
        subject,
        location,
        method: 'webhook',
        verified: true,
      });

      res.status(201).json({ record });
    } catch (error) {
      res.status(400).json({ message: "Failed to create attendance record", error: error.message });
    }
  });

  return httpServer;
}
