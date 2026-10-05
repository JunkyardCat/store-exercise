import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { COOKIE_NAME, requireAuth, setAuthCookie } from '../middleware/auth.js';

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const publicUser = (u: { id: number; email: string; name: string; role: string }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
});

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password } = parsed.data;

  const hash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
       RETURNING id, email, name, role`,
      [email, name, hash],
    );
    setAuthCookie(res, rows[0]);
    res.status(201).json(publicUser(rows[0]));
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'That email is already registered.' });
    throw err;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter your email and password.' });
  const { email, password } = parsed.data;

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Same message for unknown email and wrong password, so attackers can't tell which
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });

  setAuthCookie(res, user);
  res.json(publicUser(user));
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user!.id]);
  if (!rows[0]) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json(publicUser(rows[0]));
});
