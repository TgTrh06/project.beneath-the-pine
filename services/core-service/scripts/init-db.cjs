// Only initialize a new, empty local/test database. Existing Flyway databases need no replay.
const { Pool } = require('pg');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

async function initializeDatabase(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(724391062)');
    const result = await client.query(`SELECT EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core'
    ) OR EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flyway_schema_history'
    ) AS occupied`);
    if (result.rows[0].occupied) throw new Error('REFUSE_EXISTING_SCHEMA');
    for (const name of ['V1__create_core_schema.sql', 'V2__create_task_module.sql', 'V3__create_accounts.sql']) {
      await client.query(await readFile(resolve(__dirname, '../database/migrations', name), 'utf8'));
    }
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* Keep original error. */ }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initializeDatabase };

if (require.main === module) {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost:54322/postgres';
  const hostname = new URL(connectionString).hostname;
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    console.error('db:init only accepts a loopback local/test PostgreSQL server.');
    process.exitCode = 1;
  } else {
    const pool = new Pool({ connectionString, user: process.env.DATABASE_USERNAME, password: process.env.DATABASE_PASSWORD, connectionTimeoutMillis: 5000 });
    initializeDatabase(pool)
      .then(() => console.log('Initialized core schema from preserved V1–V3 SQL.'))
      .catch(error => {
        console.error(error.message === 'REFUSE_EXISTING_SCHEMA'
          ? 'Refused: core schema or Flyway history already exists. No changes applied; do not replay V1–V3.'
          : 'Database initialization failed; transaction rolled back. Check local PostgreSQL configuration.');
        process.exitCode = 1;
      }).finally(() => pool.end());
  }
}
