import { Global, Injectable, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { readConfig } from '../config';

@Injectable()
export class Database implements OnApplicationShutdown {
  readonly pool: Pool;
  constructor() {
    const config = readConfig();
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      user: config.DATABASE_USERNAME,
      password: config.DATABASE_PASSWORD,
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
      idle_in_transaction_session_timeout: 10000,
    });
    this.pool.on('error', () => new Logger(Database.name).error({ event: 'database_connection_failed' }));
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* Preserve the original error. */ }
      throw error;
    } finally {
      client.release();
    }
  }

  async onApplicationShutdown(): Promise<void> { await this.pool.end(); }
}

@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
