import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const NEXT_TYPE = {
  none: 'checkin',
  checkin: 'lunch_out',
  lunch_out: 'lunch_in',
  lunch_in: 'checkout',
  checkout: null,
};

const LABELS = {
  checkin: 'Ingreso',
  lunch_out: 'Salida a almorzar',
  lunch_in: 'Regreso de almorzar',
  checkout: 'Salida',
};

function todayLastType(employeeId) {
  const row = db
    .prepare(
      `SELECT type FROM attendance
       WHERE employee_id = ? AND date(timestamp, 'localtime') = date('now', 'localtime')
       ORDER BY id DESC LIMIT 1`
    )
    .get(employeeId);
  return row ? row.type : 'none';
}

// Registra el siguiente marcaje logico del dia para el empleado (usado por el kiosco de FaceID)
router.post('/punch', (req, res) => {
  const { employeeId, method } = req.body || {};
  const employee = db.prepare(`SELECT id, name FROM employees WHERE id = ? AND active = 1`).get(employeeId);
  if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

  const last = todayLastType(employeeId);
  const nextType = NEXT_TYPE[last];
  if (!nextType) {
    return res.status(409).json({ error: 'Ya completaste todos los marcajes de hoy', done: true });
  }

  db.prepare(`INSERT INTO attendance (employee_id, type, method) VALUES (?, ?, ?)`).run(
    employeeId,
    nextType,
    method || 'face'
  );

  res.status(201).json({
    employee: employee.name,
    type: nextType,
    label: LABELS[nextType],
    timestamp: new Date().toISOString(),
  });
});

router.use(requireAuth, requireAdmin);

router.get('/', (req, res) => {
  const { employeeId, from, to } = req.query;
  let query = `
    SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.timestamp, a.method
    FROM attendance a JOIN employees e ON e.id = a.employee_id
    WHERE 1=1`;
  const params = [];
  if (employeeId) {
    query += ` AND a.employee_id = ?`;
    params.push(employeeId);
  }
  if (from) {
    query += ` AND date(a.timestamp, 'localtime') >= date(?)`;
    params.push(from);
  }
  if (to) {
    query += ` AND date(a.timestamp, 'localtime') <= date(?)`;
    params.push(to);
  }
  query += ` ORDER BY a.timestamp DESC LIMIT 1000`;
  res.json(db.prepare(query).all(...params));
});

router.get('/today', (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.timestamp
       FROM attendance a JOIN employees e ON e.id = a.employee_id
       WHERE date(a.timestamp, 'localtime') = date('now', 'localtime')
       ORDER BY a.timestamp DESC`
    )
    .all();
  res.json(rows);
});

router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM attendance WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
