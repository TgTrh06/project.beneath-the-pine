import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { API_CONFIG, ApiConfig } from '../config/api-config';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool?: Pool;
  private readonly client?: NodePgDatabase;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(API_CONFIG) config: ApiConfig) {
    if (!config.API_DATABASE_URL) return;

    this.pool = new Pool({
      connectionString: config.API_DATABASE_URL,
      max: config.API_DB_POOL_MAX,
      connectionTimeoutMillis: config.API_DB_TIMEOUT_MS,
      query_timeout: config.API_DB_TIMEOUT_MS,
      statement_timeout: config.API_DB_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
    });

    this.pool.on('error', () =>
      this.logger.error({ event: 'database_pool_error' })
    );

    this.client = drizzle({ client: this.pool });
  }

  /** Module-owned repositories may use this client once their schema is reviewed. */
  get db(): NodePgDatabase {
    if (!this.client) throw new Error('API database is not configured');
    return this.client;
  }

  async isReachable(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.execute(sql`select 1`);
      return true;
    } catch {
      // Pool/provider exceptions can contain credentials and SQL values.
      this.logger.warn({ event: 'database_unreachable' });
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> { await this.pool?.end(); }
}
