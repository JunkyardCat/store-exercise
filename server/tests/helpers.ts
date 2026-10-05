import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';

export const app = createApp();

/** An agent keeps cookies between requests, like a browser. */
export async function signedUpAgent(email = 'sam@example.com') {
  const agent = request.agent(app);
  await agent.post('/api/auth/signup').send({ name: 'Sam', email, password: 'password123' }).expect(201);
  return agent;
}

export async function adminAgent() {
  const hash = await bcrypt.hash('adminpass123', 4);
  await pool.query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ('admin@example.com', 'Admin', $1, 'admin')`,
    [hash],
  );
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'adminpass123' }).expect(200);
  return agent;
}

export async function createItem(overrides: Record<string, unknown> = {}) {
  const { rows } = await pool.query(
    `INSERT INTO items (name, description, price_cents, stock) VALUES ($1, 'desc', $2, $3) RETURNING *`,
    [overrides.name ?? 'Mug', overrides.price_cents ?? 1000, overrides.stock ?? 5],
  );
  return rows[0];
}
