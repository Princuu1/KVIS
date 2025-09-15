// server/db.ts
import { Pool } from "pg";
import "dotenv/config";
import dns from "dns";

// Force Node to prefer IPv4 first (avoids IPv6-only DNS issue)
dns.setDefaultResultOrder("ipv4first");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

// Initialize tables
export async function initDB() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      college_roll_no TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      student_class TEXT NOT NULL,
      student_phone TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      student_email TEXT UNIQUE NOT NULL,
      parent_email TEXT NOT NULL,
      password TEXT NOT NULL,
      id_photo_url TEXT,
      face_descriptor JSONB,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) NOT NULL,
      date TIMESTAMP NOT NULL,
      status TEXT NOT NULL,
      subject TEXT,
      reason TEXT,
      method TEXT,
      verified BOOLEAN DEFAULT FALSE,
      location TEXT,
      latitude REAL,
      longitude REAL,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      type TEXT NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exam_schedule (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location TEXT NOT NULL,
      instructions TEXT,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS syllabus (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT now()
    );
  `);

  console.log("[DB] Tables initialized");
}
