import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Publico: usado por el kiosco para cargar los descriptores faciales y reconocer empleados
router.get('/face-data', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, face_descriptor FROM employees WHERE active = true AND face_descriptor IS NOT NULL`
  );
  res.json(rows.map((r) => ({ id: r.id, name: r.name, descriptor: JSON.parse(r.face_descriptor) })));
});

router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, photo, active, created_at,
      (face_descriptor IS NOT NULL) AS has_face
     FROM employees ORDER BY created_at DESC`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, email, password, role, descriptor, photo } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });

  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (name, email, role, password_hash, face_descriptor, photo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        name,
        email,
        role === 'admin' ? 'admin' : 'employee',
        passwordHash,
        descriptor ? JSON.stringify(descriptor) : null,
        photo || null,
      ]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un empleado con ese email' });
    }
    res.status(500).json({ error: 'Error creando empleado' });
  }
});

router.put('/:id/face', async (req, res) => {
  const { descriptor, photo } = req.body || {};
  if (!descriptor) return res.status(400).json({ error: 'Descriptor facial requerido' });
  await pool.query(`UPDATE employees SET face_descriptor = $1, photo = COALESCE($2, photo) WHERE id = $3`, [
    JSON.stringify(descriptor),
    photo || null,
    req.params.id,
  ]);
  res.json({ ok: true });
});

router.put('/:id', async (req, res) => {
  const { name, email, role, active } = req.body || {};
  await pool.query(
    `UPDATE employees SET name = COALESCE($1, name), email = COALESCE($2, email),
      role = COALESCE($3, role), active = COALESCE($4, active) WHERE id = $5`,
    [name ?? null, email ?? null, role ?? null, active === undefined ? null : Boolean(active), req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM employees WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

export default router;
