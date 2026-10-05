import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, signedUpAgent, createItem } from './helpers.js';
import { pool } from '../src/db/pool.js';

describe('orders', () => {
  it('requires login', async () => {
    await request(app).post('/api/orders').send({ items: [{ itemId: 1, quantity: 1 }] }).expect(401);
  });

  it('places an order, uses database prices, and reduces stock', async () => {
    const item = await createItem({ price_cents: 1500, stock: 5 });
    const agent = await signedUpAgent();
    const res = await agent
      .post('/api/orders')
      .send({ items: [{ itemId: item.id, quantity: 2 }] })
      .expect(201);
    expect(res.body.total_cents).toBe(3000);

    const { rows } = await pool.query('SELECT stock FROM items WHERE id = $1', [item.id]);
    expect(rows[0].stock).toBe(3);

    const history = await agent.get('/api/orders').expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].items[0]).toMatchObject({ item_name: 'Mug', quantity: 2 });
  });

  it('refuses to oversell and changes nothing', async () => {
    const item = await createItem({ stock: 1 });
    const agent = await signedUpAgent();
    await agent.post('/api/orders').send({ items: [{ itemId: item.id, quantity: 2 }] }).expect(409);
    const { rows } = await pool.query('SELECT stock FROM items WHERE id = $1', [item.id]);
    expect(rows[0].stock).toBe(1);
    const orders = await pool.query('SELECT COUNT(*)::int AS n FROM orders');
    expect(orders.rows[0].n).toBe(0);
  });

  it('rejects an empty cart', async () => {
    const agent = await signedUpAgent();
    await agent.post('/api/orders').send({ items: [] }).expect(400);
  });
});
