import pg from 'pg';
import { config } from '../config.js';

// Hosted databases such as Aiven require SSL. If you provide the CA
// certificate we verify the server; otherwise we encrypt without verifying.
const ssl = config.databaseSsl
  ? config.databaseCa
    ? { ca: config.databaseCa, rejectUnauthorized: true }
    : { rejectUnauthorized: false }
  : undefined;

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl,
  max: 5, // free tiers allow few connections
});
