const { resolve } = require('node:path');
require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { seedKeeper, seedCredentials } = require('../dist/modules/identity/seed');
async function main() {
  // Validate before connecting; never print credentials or provider exceptions.
  seedCredentials(process.env);
  if (!process.env.API_DATABASE_URL) throw new Error('API_DATABASE_URL is required.');
  const pool = new Pool({ connectionString: process.env.API_DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
  pool.on('error', () => { console.error('Seed database connection failed.'); process.exitCode = 1; });
  try { console.log(`Pine Keeper: ${await seedKeeper(drizzle(pool), process.env)}.`); }
  finally { await pool.end(); }
}
main().catch(() => { console.error('Seed failed. Check env, migration state, and whether the email already belongs to a Wanderer. No existing credentials were changed.'); process.exitCode = 1; });
