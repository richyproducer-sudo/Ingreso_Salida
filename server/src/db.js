import dns from 'node:dns';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Algunos entornos Windows fallan al resolver hosts largos via dns.lookup (getaddrinfo)
// aunque el DNS funciona bien a nivel de protocolo. Si falla, reintenta via dns.resolve4/6.
const nativeLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  nativeLookup(hostname, options, (err, address, family) => {
    if (!err) return cb(null, address, family);
    dns.resolve4(hostname, (err4, addresses) => {
      if (!err4 && addresses.length) return cb(null, addresses[0], 4);
      dns.resolve6(hostname, (err6, addresses6) => {
        if (!err6 && addresses6.length) return cb(null, addresses6[0], 6);
        cb(err);
      });
    });
  });
};

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
      password_hash TEXT,
      face_descriptor TEXT,
      photo TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('checkin', 'lunch_out', 'lunch_in', 'checkout')),
      timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
      method TEXT NOT NULL DEFAULT 'face'
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
  `);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM employees WHERE role = 'admin'`);
  if (rows[0].c === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await pool.query(
      `INSERT INTO employees (name, email, role, password_hash, active) VALUES ($1, $2, 'admin', $3, true)`,
      ['Administrador', 'admin@empresa.com', passwordHash]
    );
    console.log('Usuario admin creado -> email: admin@empresa.com  password: admin123');
  }
}
