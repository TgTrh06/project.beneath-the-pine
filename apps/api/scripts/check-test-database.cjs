const { Pool } = require('pg');
async function main() {
  const raw = process.env.PYNEATH_TEST_DATABASE_URL;
  if (!raw) throw new Error('Missing PYNEATH_TEST_DATABASE_URL; PostgreSQL suites must not silently skip');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(raw).hostname)) throw new Error('PostgreSQL test target must be a local disposable service');
  const pool = new Pool({ connectionString: raw, connectionTimeoutMillis: 3000 });
  try { await pool.query('select 1'); } finally { await pool.end(); }
  console.log('PostgreSQL integration prerequisites verified');
}
main().catch(error => { console.error(error.message.startsWith('Missing ') ? error.message : 'PostgreSQL test database preflight failed'); process.exitCode = 1; });
