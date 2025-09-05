import { 
  type User, 
  type InsertUser, 
  type AttendanceRecord, 
  type InsertAttendance,
  type CalendarEvent,
  type InsertCalendarEvent,
  type ExamScheduleItem,
  type InsertExam,
  type SyllabusItem,
  type InsertSyllabus,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByRollNo(rollNo: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map();
  private calendarEvents: Map<string, CalendarEvent> = new Map();
  private examSchedule: Map<string, ExamScheduleItem> = new Map();
  private syllabus: Map<string, SyllabusItem> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByRollNo(rollNo: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.collegeRollNo === rollNo);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.studentEmail === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAttendanceRecords(userId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(record => record.userId === userId)
      .filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createAttendanceRecord(insertRecord: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const record: AttendanceRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async getAttendanceStats(userId: string): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    percentage: number;
  }> {
    const records = await this.getAttendanceRecords(userId);
    const totalPresent = records.filter(r => r.status === 'present').length;
    const totalAbsent = records.filter(r => r.status === 'absent').length;
    const totalLeave = records.filter(r => r.status === 'leave').length;
    const total = records.length;
    
    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      percentage: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
    };
  }

  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter(event => {
        if (startDate && event.date < startDate) return false;
        if (endDate && event.date > endDate) return false;
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  async getExamSchedule(): Promise<ExamScheduleItem[]> {
    return Array.from(this.examSchedule.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createExam(insertExam: InsertExam): Promise<ExamScheduleItem> {
    const id = randomUUID();
    const exam: ExamScheduleItem = {
      ...insertExam,
      id,
      createdAt: new Date(),
    };
    this.examSchedule.set(id, exam);
    return exam;
  }

  async updateExam(id: string, updates: Partial<ExamScheduleItem>): Promise<ExamScheduleItem | undefined> {
    const exam = this.examSchedule.get(id);
    if (!exam) return undefined;
    
    const updatedExam = { ...exam, ...updates };
    this.examSchedule.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: string): Promise<boolean> {
    return this.examSchedule.delete(id);
  }

  async getSyllabus(): Promise<SyllabusItem[]> {
    return Array.from(this.syllabus.values())
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return a.subject.localeCompare(b.subject);
      });
  }

  async createSyllabusItem(insertItem: InsertSyllabus): Promise<SyllabusItem> {
    const id = randomUUID();
    const item: SyllabusItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.syllabus.set(id, item);
    return item;
  }

  async updateSyllabusItem(id: string, updates: Partial<SyllabusItem>): Promise<SyllabusItem | undefined> {
    const item = this.syllabus.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.syllabus.set(id, updatedItem);
    return updatedItem;
  }

  async deleteSyllabusItem(id: string): Promise<boolean> {
    return this.syllabus.delete(id);
  }

  async getChatMessages(room: string, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.room === room)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse();
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
