import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, adminAgent, signedUpAgent, createItem } from './helpers.js';

const newItem = { name: 'Lamp', description: 'A lamp', price_cents: 2500, stock: 3, image_url: '' };

describe('items', () => {
  it('lists items publicly and supports search', async () => {
    await createItem({ name: 'Blue Mug' });
    await createItem({ name: 'Red Lamp' });
    const all = await request(app).get('/api/items').expect(200);
    expect(all.body).toHaveLength(2);
    const found = await request(app).get('/api/items?q=lamp').expect(200);
    expect(found.body.map((i: any) => i.name)).toEqual(['Red Lamp']);
  });

  it('returns 404 for a missing item', async () => {
    await request(app).get('/api/items/999').expect(404);
    await request(app).get('/api/items/abc').expect(404);
  });

  it('lets an admin create, update and delete', async () => {
    const admin = await adminAgent();
    const created = await admin.post('/api/items').send(newItem).expect(201);
    const id = created.body.id;

    const updated = await admin.put(`/api/items/${id}`).send({ ...newItem, price_cents: 3000 }).expect(200);
    expect(updated.body.price_cents).toBe(3000);

    await admin.delete(`/api/items/${id}`).expect(204);
    await request(app).get(`/api/items/${id}`).expect(404);
  });

  it('validates admin input', async () => {
    const admin = await adminAgent();
    await admin.post('/api/items').send({ ...newItem, price_cents: -5 }).expect(400);
    await admin.post('/api/items').send({ ...newItem, name: '' }).expect(400);
  });

  it('blocks logged-out visitors and customers from changing items', async () => {
    await request(app).post('/api/items').send(newItem).expect(401);
    const customer = await signedUpAgent();
    await customer.post('/api/items').send(newItem).expect(403);
  });
});
