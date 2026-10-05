import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const orderSchema = z.object({
  items: z
    .array(z.object({ itemId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) }))
    .min(1, 'Your cart is empty.'),
});

// Place an order. Prices come from the database, never from the browser.
ordersRouter.post('/', async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  // Merge duplicate lines so the same item is only locked once
  const wanted = new Map<number, number>();
  for (const line of parsed.data.items) {
    wanted.set(line.itemId, (wanted.get(line.itemId) ?? 0) + line.quantity);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const lines: { id: number; name: string; price: number; qty: number }[] = [];

    for (const [itemId, qty] of [...wanted.entries()].sort((a, b) => a[0] - b[0])) {
      // FOR UPDATE locks the row so two buyers can't both take the last one
      const { rows } = await client.query('SELECT * FROM items WHERE id = $1 FOR UPDATE', [itemId]);
      const item = rows[0];
      if (!item) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'An item in your cart no longer exists.' });
      }
      if (item.stock < qty) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: `Only ${item.stock} of "${item.name}" left in stock.` });
      }
      await client.query('UPDATE items SET stock = stock - $1 WHERE id = $2', [qty, itemId]);
      total += item.price_cents * qty;
      lines.push({ id: item.id, name: item.name, price: item.price_cents, qty });
    }

    const { rows: orderRows } = await client.query(
      'INSERT INTO orders (user_id, total_cents) VALUES ($1, $2) RETURNING id, total_cents, created_at',
      [req.user!.id, total],
    );
    const order = orderRows[0];
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, unit_price_cents, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, l.id, l.name, l.price, l.qty],
      );
    }
    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

// My order history
ordersRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.total_cents, o.created_at,
            COALESCE(json_agg(json_build_object(
              'item_name', oi.item_name,
              'unit_price_cents', oi.unit_price_cents,
              'quantity', oi.quantity
            ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.id DESC`,
    [req.user!.id],
  );
  res.json(rows);
});
