// server/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------- USERS ----------------
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collegeRollNo: text("college_roll_no").notNull().unique(),
  fullName: text("full_name").notNull(),
  studentPhone: text("student_phone").notNull(),
  parentPhone: text("parent_phone").notNull(),
  studentEmail: text("student_email").notNull().unique(),
  parentEmail: text("parent_email").notNull(),
  studentClass: text("student_class").notNull(), // ✅ Added studentClass
  password: text("password").notNull(),
  idPhotoUrl: text("id_photo_url"),
  faceDescriptor: jsonb("face_descriptor"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- ATTENDANCE ----------------
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  status: text("status").notNull(),
  subject: text("subject"),
  reason: text("reason"),
  method: text("method"),
  verified: boolean("verified").default(false),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- CALENDAR ----------------
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  type: text("type").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- EXAMS ----------------
export const examSchedule = pgTable("exam_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- SYLLABUS ----------------
export const syllabus = pgTable("syllabus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- CHAT ----------------
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  room: text("room").default("general"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// ---------------- INSERT SCHEMAS ----------------
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, isActive: true })
  .extend({
    studentClass: z.string().min(1, "Class is required"), // ✅ Zod validation
  });

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertExamSchema = createInsertSchema(examSchedule).omit({
  id: true,
  createdAt: true,
});

export const insertSyllabusSchema = createInsertSchema(syllabus).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// ---------------- LOGIN SCHEMA ----------------
export const loginSchema = z.object({
  collegeRollNo: z.string().min(1, "Roll number is required"),
  password: z.string().min(1, "Password is required"),
});

// ---------------- TYPES ----------------
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type ExamScheduleItem = typeof examSchedule.$inferSelect;
export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;
export type SyllabusItem = typeof syllabus.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
