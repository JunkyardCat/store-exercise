import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

export const itemsRouter = Router();

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).default(''),
  price_cents: z.number().int().min(0, 'Price cannot be negative'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  image_url: z.string().trim().max(1000).default(''),
});

const idParam = z.coerce.number().int().positive();

// Public: list items, optional ?q= search
itemsRouter.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const { rows } = q
    ? await pool.query('SELECT * FROM items WHERE name ILIKE $1 ORDER BY id DESC', [`%${q}%`])
    : await pool.query('SELECT * FROM items ORDER BY id DESC');
  res.json(rows);
});

itemsRouter.get('/:id', async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ error: 'Item not found.' });
  const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [id.data]);
  if (!rows[0]) return res.status(404).json({ error: 'Item not found.' });
  res.json(rows[0]);
});

// Admin only below
itemsRouter.post('/', requireAdmin, async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO items (name, description, price_cents, stock, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [d.name, d.description, d.price_cents, d.stock, d.image_url],
  );
  res.status(201).json(rows[0]);
});

itemsRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ error: 'Item not found.' });
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const { rows } = await pool.query(
    `UPDATE items SET name = $1, description = $2, price_cents = $3, stock = $4, image_url = $5
     WHERE id = $6 RETURNING *`,
    [d.name, d.description, d.price_cents, d.stock, d.image_url, id.data],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Item not found.' });
  res.json(rows[0]);
});

itemsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ error: 'Item not found.' });
  const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1', [id.data]);
  if (!rowCount) return res.status(404).json({ error: 'Item not found.' });
  res.status(204).end();
});
