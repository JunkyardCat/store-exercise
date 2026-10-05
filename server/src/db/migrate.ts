import { pool } from './pool.js';
import { schema } from './schema.js';

export async function migrate() {
  await pool.query(schema);
}

// Run directly: `npm run migrate`
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => console.log('Database schema is up to date.'))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
