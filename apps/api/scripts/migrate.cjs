const { resolve } = require('node:path');
require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
async function main() {
  if (!process.env.API_DATABASE_URL) throw new Error('Missing database URL');
  const pool = new Pool({ connectionString: process.env.API_DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
  pool.on('error', () => { console.error('Migration database connection failed.'); process.exitCode = 1; });
  try {
    await migrate(drizzle(pool), { migrationsFolder: resolve(__dirname, '../drizzle') });
    console.log('Migration complete.');
  } finally { await pool.end(); }
}
main().catch(() => { console.error('Migration failed. Check database configuration and migration history.'); process.exitCode = 1; });
