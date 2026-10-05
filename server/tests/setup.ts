import 'dotenv/config';
import 'express-async-errors';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Safety: tests wipe tables, so they must NEVER run against the dev/production DB.
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error('TEST_DATABASE_URL is not set. Add it to server/.env (see .env.example).');
}
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests

const { pool } = await import('../src/db/pool.js');
const { migrate } = await import('../src/db/migrate.js');

beforeAll(async () => {
  await migrate();
});

beforeEach(async () => {
  await pool.query('TRUNCATE order_items, orders, items, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
