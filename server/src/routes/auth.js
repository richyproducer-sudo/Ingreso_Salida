import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contrasena requeridos' });

  const user = db.prepare(`SELECT * FROM employees WHERE email = ? AND active = 1`).get(email);
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Credenciales invalidas' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

  const token = signToken({ id: user.id, name: user.name, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export default router;
