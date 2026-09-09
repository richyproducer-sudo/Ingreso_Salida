import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Publico: usado por el kiosco para cargar los descriptores faciales y reconocer empleados
router.get('/face-data', (req, res) => {
  const rows = db
    .prepare(`SELECT id, name, face_descriptor FROM employees WHERE active = 1 AND face_descriptor IS NOT NULL`)
    .all();
  res.json(rows.map((r) => ({ id: r.id, name: r.name, descriptor: JSON.parse(r.face_descriptor) })));
});

router.use(requireAuth, requireAdmin);

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, email, role, photo, active, created_at,
        (face_descriptor IS NOT NULL) AS has_face
       FROM employees ORDER BY created_at DESC`
    )
    .all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, email, password, role, descriptor, photo } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });

  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
  try {
    const info = db
      .prepare(
        `INSERT INTO employees (name, email, role, password_hash, face_descriptor, photo)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        email,
        role === 'admin' ? 'admin' : 'employee',
        passwordHash,
        descriptor ? JSON.stringify(descriptor) : null,
        photo || null
      );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un empleado con ese email' });
    }
    res.status(500).json({ error: 'Error creando empleado' });
  }
});

router.put('/:id/face', (req, res) => {
  const { descriptor, photo } = req.body || {};
  if (!descriptor) return res.status(400).json({ error: 'Descriptor facial requerido' });
  db.prepare(`UPDATE employees SET face_descriptor = ?, photo = COALESCE(?, photo) WHERE id = ?`).run(
    JSON.stringify(descriptor),
    photo || null,
    req.params.id
  );
  res.json({ ok: true });
});

router.put('/:id', (req, res) => {
  const { name, email, role, active } = req.body || {};
  db.prepare(
    `UPDATE employees SET name = COALESCE(?, name), email = COALESCE(?, email),
      role = COALESCE(?, role), active = COALESCE(?, active) WHERE id = ?`
  ).run(name ?? null, email ?? null, role ?? null, active === undefined ? null : active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM employees WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
