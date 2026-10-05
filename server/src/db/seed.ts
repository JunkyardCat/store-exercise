import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { config } from '../config.js';
import { migrate } from './migrate.js';

const sampleItems = [
  { name: 'Canvas Tote Bag', description: 'Heavy cotton tote with reinforced handles.', price_cents: 1800, stock: 40 },
  { name: 'Ceramic Mug', description: 'Hand-glazed 350 ml mug, dishwasher safe.', price_cents: 1400, stock: 25 },
  { name: 'Notebook (A5)', description: '120 pages of dotted paper, lay-flat binding.', price_cents: 900, stock: 100 },
  { name: 'Enamel Pin Set', description: 'Set of three pins.', price_cents: 1200, stock: 60 },
];

async function seed() {
  await migrate();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, 'Admin', $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
      [email.toLowerCase(), hash],
    );
    console.log(`Admin account ready: ${email}`);
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin creation.');
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM items');
  if (rows[0].n === 0) {
    for (const i of sampleItems) {
      await pool.query(
        'INSERT INTO items (name, description, price_cents, stock) VALUES ($1, $2, $3, $4)',
        [i.name, i.description, i.price_cents, i.stock],
      );
    }
    console.log(`Inserted ${sampleItems.length} sample items.`);
  }
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
