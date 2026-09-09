import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'attendance.db');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    password_hash TEXT,
    face_descriptor TEXT,
    photo TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('checkin', 'lunch_out', 'lunch_in', 'checkout')),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    method TEXT NOT NULL DEFAULT 'face'
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
`);

const adminCount = db.prepare(`SELECT COUNT(*) AS c FROM employees WHERE role = 'admin'`).get().c;
if (adminCount === 0) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO employees (name, email, role, password_hash, active) VALUES (?, ?, 'admin', ?, 1)`
  ).run('Administrador', 'admin@empresa.com', passwordHash);
  console.log('Usuario admin creado -> email: admin@empresa.com  password: admin123');
}
