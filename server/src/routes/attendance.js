import { Router } from 'express';
import { pool } from '../db.js';
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

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start, end];
}

async function todayLastType(employeeId) {
  const [start, end] = todayRange();
  const { rows } = await pool.query(
    `SELECT type FROM attendance WHERE employee_id = $1 AND timestamp >= $2 AND timestamp < $3 ORDER BY id DESC LIMIT 1`,
    [employeeId, start, end]
  );
  return rows[0]?.type || 'none';
}

// Registra el siguiente marcaje logico del dia para el empleado (usado por el kiosco de FaceID)
router.post('/punch', async (req, res) => {
  const { employeeId, method } = req.body || {};
  const { rows: empRows } = await pool.query(`SELECT id, name FROM employees WHERE id = $1 AND active = true`, [
    employeeId,
  ]);
  const employee = empRows[0];
  if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

  const last = await todayLastType(employeeId);
  const nextType = NEXT_TYPE[last];
  if (!nextType) {
    return res.status(409).json({ error: 'Ya completaste todos los marcajes de hoy', done: true });
  }

  await pool.query(`INSERT INTO attendance (employee_id, type, method) VALUES ($1, $2, $3)`, [
    employeeId,
    nextType,
    method || 'face',
  ]);

  res.status(201).json({
    employee: employee.name,
    type: nextType,
    label: LABELS[nextType],
    timestamp: new Date().toISOString(),
  });
});

router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const { employeeId, from, to } = req.query;
  let sql = `
    SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.timestamp, a.method
    FROM attendance a JOIN employees e ON e.id = a.employee_id
    WHERE 1=1`;
  const params = [];
  if (employeeId) {
    params.push(employeeId);
    sql += ` AND a.employee_id = $${params.length}`;
  }
  if (from) {
    params.push(new Date(`${from}T00:00:00`));
    sql += ` AND a.timestamp >= $${params.length}`;
  }
  if (to) {
    const toDate = new Date(`${to}T00:00:00`);
    toDate.setDate(toDate.getDate() + 1);
    params.push(toDate);
    sql += ` AND a.timestamp < $${params.length}`;
  }
  sql += ` ORDER BY a.timestamp DESC LIMIT 1000`;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.get('/today', async (req, res) => {
  const [start, end] = todayRange();
  const { rows } = await pool.query(
    `SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.timestamp
     FROM attendance a JOIN employees e ON e.id = a.employee_id
     WHERE a.timestamp >= $1 AND a.timestamp < $2
     ORDER BY a.timestamp DESC`,
    [start, end]
  );
  res.json(rows);
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM attendance WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

export default router;
