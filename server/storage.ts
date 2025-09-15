// server/storage.ts
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { pool } from "./db"; // must export Pool instance from server/db.ts
import type {
  User,
  InsertUser,
  AttendanceRecord,
  InsertAttendance,
  CalendarEvent,
  InsertCalendarEvent,
  ExamScheduleItem,
  InsertExam,
  SyllabusItem,
  InsertSyllabus,
  ChatMessage,
  InsertChatMessage,
} from "@shared/schema";

/**
 * IStorage interface
 */
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByRollNo(rollNo: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // 👇 New face recognition helpers
  getUserFaceDescriptor(userId: string): Promise<number[] | null>;
  updateUserFaceDescriptor(userId: string, faceDescriptor: number[]): Promise<User | undefined>;

  // Attendance operations
  getAttendanceRecords(userId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceStats(userId: string): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    percentage: number;
  }>;

  // Calendar operations
  getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  // Exam operations
  getExamSchedule(): Promise<ExamScheduleItem[]>;
  createExam(exam: InsertExam): Promise<ExamScheduleItem>;
  updateExam(id: string, updates: Partial<ExamScheduleItem>): Promise<ExamScheduleItem | undefined>;
  deleteExam(id: string): Promise<boolean>;

  // Syllabus operations
  getSyllabus(): Promise<SyllabusItem[]>;
  createSyllabusItem(item: InsertSyllabus): Promise<SyllabusItem>;
  updateSyllabusItem(id: string, updates: Partial<SyllabusItem>): Promise<SyllabusItem | undefined>;
  deleteSyllabusItem(id: string): Promise<boolean>;

  // Chat operations
  getChatMessages(room: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // File helper
  uploadIdPhotoFromFile(filePath: string, originalName?: string): Promise<string>;
}

/**
 * Database-backed storage using `pg`
 */
class PgStorage implements IStorage {
  // ---------- Users ----------
  async getUser(id: string): Promise<User | undefined> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] ?? undefined;
  }

  async getUserByRollNo(rollNo: string): Promise<User | undefined> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE college_roll_no = $1 LIMIT 1`, [rollNo]);
    return rows[0] ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE student_email = $1 LIMIT 1`, [email]);
    return rows[0] ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (insertUser as any).id ?? randomUUID();

    const values = [
  id,
  (insertUser as any).collegeRollNo,
  (insertUser as any).fullName,
  (insertUser as any).studentPhone,
  (insertUser as any).parentPhone,
  (insertUser as any).studentEmail,
  (insertUser as any).parentEmail,
  (insertUser as any).password,     // goes to password
  (insertUser as any).idPhotoUrl ?? null,
  (insertUser as any).faceDescriptor ? JSON.stringify((insertUser as any).faceDescriptor) : null,
  (insertUser as any).isActive ?? true,
  (insertUser as any).studentClass, // 👈 now last
];

const q = `
  INSERT INTO users (
    id, college_roll_no, full_name, student_phone, parent_phone,
    student_email, parent_email, password, id_photo_url, face_descriptor, is_active, student_class
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
  ) RETURNING *;
`;


    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  const setParts: string[] = [];
  const args: any[] = [];
  let idx = 1;

  const mapField = (dbCol: string, val: any) => {
    setParts.push(`${dbCol} = $${idx}`);
    args.push(val);
    idx++;
  };

  if ((updates as any).collegeRollNo !== undefined) mapField("college_roll_no", (updates as any).collegeRollNo);
  if ((updates as any).fullName !== undefined) mapField("full_name", (updates as any).fullName);
  if ((updates as any).studentPhone !== undefined) mapField("student_phone", (updates as any).studentPhone);
  if ((updates as any).parentPhone !== undefined) mapField("parent_phone", (updates as any).parentPhone);
  if ((updates as any).studentEmail !== undefined) mapField("student_email", (updates as any).studentEmail);
  if ((updates as any).parentEmail !== undefined) mapField("parent_email", (updates as any).parentEmail);
  if ((updates as any).password !== undefined) mapField("password", (updates as any).password);
  if ((updates as any).idPhotoUrl !== undefined) mapField("id_photo_url", (updates as any).idPhotoUrl);
  if ((updates as any).faceDescriptor !== undefined) mapField("face_descriptor", JSON.stringify((updates as any).faceDescriptor));
  if ((updates as any).isActive !== undefined) mapField("is_active", (updates as any).isActive);
  if ((updates as any).studentClass !== undefined) mapField("student_class", (updates as any).studentClass); // ✅ Fix

  if (setParts.length === 0) return this.getUser(id);

  const sql = `UPDATE users SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *;`;
  args.push(id);

  const { rows } = await pool.query(sql, args);
  return rows[0] ?? undefined;
}

  // ---------- Face Recognition ----------
  async getUserFaceDescriptor(userId: string): Promise<number[] | null> {
    const { rows } = await pool.query(`SELECT face_descriptor FROM users WHERE id = $1`, [userId]);
    if (!rows[0] || !rows[0].face_descriptor) return null;
    return JSON.parse(rows[0].face_descriptor);
  }

  async updateUserFaceDescriptor(userId: string, faceDescriptor: number[]): Promise<User | undefined> {
    const { rows } = await pool.query(
      `UPDATE users SET face_descriptor = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(faceDescriptor), userId]
    );
    return rows[0] ?? undefined;
  }

  // ---------- Attendance ----------
  async getAttendanceRecords(userId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    const args: any[] = [userId];
    let idx = 2;
    let where = `user_id = $1`;

    if (startDate) {
      where += ` AND date >= $${idx++}`;
      args.push(startDate.toISOString());
    }
    if (endDate) {
      where += ` AND date <= $${idx++}`;
      args.push(endDate.toISOString());
    }

    const q = `SELECT * FROM attendance_records WHERE ${where} ORDER BY date DESC;`;
    const { rows } = await pool.query(q, args);
    return rows;
  }

  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const id = (record as any).id ?? randomUUID();
    const values = [
      id,
      (record as any).userId,
      (record as any).date,
      (record as any).status,
      (record as any).subject ?? null,
      (record as any).reason ?? null,
      (record as any).method ?? null,
      (record as any).verified ?? false,
      (record as any).location ?? null,
      (record as any).latitude ?? null,
      (record as any).longitude ?? null,
    ];

    const q = `
      INSERT INTO attendance_records (
        id, user_id, date, status, subject, reason, method, verified, location, latitude, longitude
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async getAttendanceStats(userId: string) {
    const records = await this.getAttendanceRecords(userId);
    const totalPresent = records.filter(r => r.status === "present").length;
    const totalAbsent = records.filter(r => r.status === "absent").length;
    const totalLeave = records.filter(r => r.status === "leave").length;
    const total = records.length;
    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      percentage: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
    };
  }

  // ---------- Calendar ----------
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const args: any[] = [];
    let where = "";
    let idx = 1;

    if (startDate) {
      where += `${where ? " AND " : ""} date >= $${idx++}`;
      args.push(startDate.toISOString());
    }
    if (endDate) {
      where += `${where ? " AND " : ""} date <= $${idx++}`;
      args.push(endDate.toISOString());
    }

    const q = where
      ? `SELECT * FROM calendar_events WHERE ${where} ORDER BY date ASC`
      : `SELECT * FROM calendar_events ORDER BY date ASC`;

    const { rows } = await pool.query(q, args);
    return rows;
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = (event as any).id ?? randomUUID();
    const values = [
      id,
      (event as any).title,
      (event as any).description ?? null,
      (event as any).date,
      (event as any).endDate ?? null,
      (event as any).type,
      (event as any).createdBy ?? null,
    ];

    const q = `
      INSERT INTO calendar_events (id, title, description, date, end_date, type, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const setParts: string[] = [];
    const args: any[] = [];
    let idx = 1;

    if ((updates as any).title !== undefined) { setParts.push(`title = $${idx++}`); args.push((updates as any).title); }
    if ((updates as any).description !== undefined) { setParts.push(`description = $${idx++}`); args.push((updates as any).description); }
    if ((updates as any).date !== undefined) { setParts.push(`date = $${idx++}`); args.push((updates as any).date); }
    if ((updates as any).endDate !== undefined) { setParts.push(`end_date = $${idx++}`); args.push((updates as any).endDate); }
    if ((updates as any).type !== undefined) { setParts.push(`type = $${idx++}`); args.push((updates as any).type); }
    if ((updates as any).createdBy !== undefined) { setParts.push(`created_by = $${idx++}`); args.push((updates as any).createdBy); }

    if (setParts.length === 0) return (await this.getCalendarEvents()).find(e => e.id === id);

    const sql = `UPDATE calendar_events SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *;`;
    args.push(id);
    const { rows } = await pool.query(sql, args);
    return rows[0] ?? undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM calendar_events WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ---------- Exams ----------
  async getExamSchedule(): Promise<ExamScheduleItem[]> {
    const { rows } = await pool.query(`SELECT * FROM exam_schedule ORDER BY date ASC`);
    return rows;
  }

  async createExam(exam: InsertExam): Promise<ExamScheduleItem> {
    const id = (exam as any).id ?? randomUUID();
    const values = [
      id,
      (exam as any).subject,
      (exam as any).date,
      (exam as any).startTime,
      (exam as any).endTime,
      (exam as any).location,
      (exam as any).instructions ?? null,
    ];
    const q = `
      INSERT INTO exam_schedule (id, subject, date, start_time, end_time, location, instructions)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async updateExam(id: string, updates: Partial<ExamScheduleItem>): Promise<ExamScheduleItem | undefined> {
    const setParts: string[] = [];
    const args: any[] = [];
    let idx = 1;

    if ((updates as any).subject !== undefined) { setParts.push(`subject = $${idx++}`); args.push((updates as any).subject); }
    if ((updates as any).date !== undefined) { setParts.push(`date = $${idx++}`); args.push((updates as any).date); }
    if ((updates as any).startTime !== undefined) { setParts.push(`start_time = $${idx++}`); args.push((updates as any).startTime); }
    if ((updates as any).endTime !== undefined) { setParts.push(`end_time = $${idx++}`); args.push((updates as any).endTime); }
    if ((updates as any).location !== undefined) { setParts.push(`location = $${idx++}`); args.push((updates as any).location); }
    if ((updates as any).instructions !== undefined) { setParts.push(`instructions = $${idx++}`); args.push((updates as any).instructions); }

    if (setParts.length === 0) return (await this.getExamSchedule()).find(e => e.id === id);

    const sql = `UPDATE exam_schedule SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *;`;
    args.push(id);
    const { rows } = await pool.query(sql, args);
    return rows[0] ?? undefined;
  }

  async deleteExam(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM exam_schedule WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ---------- Syllabus ----------
  async getSyllabus(): Promise<SyllabusItem[]> {
    const { rows } = await pool.query(`SELECT * FROM syllabus ORDER BY due_date NULLS LAST, subject ASC`);
    return rows;
  }

  async createSyllabusItem(item: InsertSyllabus): Promise<SyllabusItem> {
    const id = (item as any).id ?? randomUUID();
    const values = [
      id,
      (item as any).subject,
      (item as any).topic,
      (item as any).description ?? null,
      (item as any).completed ?? false,
      (item as any).dueDate ?? null,
    ];
    const q = `
      INSERT INTO syllabus (id, subject, topic, description, completed, due_date)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async updateSyllabusItem(id: string, updates: Partial<SyllabusItem>): Promise<SyllabusItem | undefined> {
    const setParts: string[] = [];
    const args: any[] = [];
    let idx = 1;

    if ((updates as any).subject !== undefined) { setParts.push(`subject = $${idx++}`); args.push((updates as any).subject); }
    if ((updates as any).topic !== undefined) { setParts.push(`topic = $${idx++}`); args.push((updates as any).topic); }
    if ((updates as any).description !== undefined) { setParts.push(`description = $${idx++}`); args.push((updates as any).description); }
    if ((updates as any).completed !== undefined) { setParts.push(`completed = $${idx++}`); args.push((updates as any).completed); }
    if ((updates as any).dueDate !== undefined) { setParts.push(`due_date = $${idx++}`); args.push((updates as any).dueDate); }

    if (setParts.length === 0) return (await this.getSyllabus()).find(x => x.id === id);

    const sql = `UPDATE syllabus SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *;`;
    args.push(id);
    const { rows } = await pool.query(sql, args);
    return rows[0] ?? undefined;
  }

  async deleteSyllabusItem(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM syllabus WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ---------- Chat ----------
  async getChatMessages(room: string, limit: number = 50): Promise<ChatMessage[]> {
    const { rows } = await pool.query(
      `SELECT * FROM chat_messages WHERE room = $1 ORDER BY created_at DESC LIMIT $2`,
      [room, limit]
    );
    return rows.reverse();
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = (message as any).id ?? randomUUID();
    const values = [
      id,
      (message as any).userId,
      (message as any).message,
      (message as any).room ?? "general",
    ];
    const q = `
      INSERT INTO chat_messages (id, user_id, message, room)
      VALUES ($1,$2,$3,$4) RETURNING *;
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  // ---------- File upload helper ----------
  async uploadIdPhotoFromFile(filePath: string, originalName?: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = originalName ? path.extname(originalName) : path.extname(filePath);
    const newName = `${randomUUID()}${ext}`;
    const destPath = path.join(uploadsDir, newName);

    await fs.copyFile(filePath, destPath);

    return `/uploads/${newName}`;
  }
}

// Export singleton
export const storage: IStorage = new PgStorage();
