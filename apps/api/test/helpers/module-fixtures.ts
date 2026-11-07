import { randomUUID } from 'node:crypto';
import type { DatabaseService } from '../../src/platform/database/database.service';
import { PostgresUnitOfWork } from '../../src/platform/database/postgres-unit-of-work';
import { AnalyticsService } from '../../src/modules/analytics/application/analytics.service';
import { DrizzleAnalyticsRepository } from '../../src/modules/analytics/infrastructure/analytics.repository';
import { SeedService } from '../../src/modules/seed/application/seed.service';
import { DrizzleSeedRepository } from '../../src/modules/seed/infrastructure/seed.repository';
import { Subject } from 'rxjs';
import type { ApiConfig } from '../../src/platform/config/api-config';
import { IdentityService } from '../../src/modules/identity/application/identity.service';
import type { IdentityRepository } from '../../src/modules/identity/application/identity.ports';
import { DrizzleIdentityRepository } from '../../src/modules/identity/infrastructure/identity.repository';
import { identityCrypto } from '../../src/modules/identity/infrastructure/identity-crypto';
import { IdentityHttpAdapter } from '../../src/modules/identity/presentation/identity-http.adapter';

export function createAnalytics(database: DatabaseService) {
  const transactions = new PostgresUnitOfWork(database);
  return new AnalyticsService(new DrizzleAnalyticsRepository(transactions), transactions, { now: () => new Date() }, randomUUID);
}
export function createSeeds(database: DatabaseService) {
  return new SeedService(new DrizzleSeedRepository(new PostgresUnitOfWork(database)), { now: () => new Date() });
}
export function createIdentityStore(database: DatabaseService) {
  return new DrizzleIdentityRepository(new PostgresUnitOfWork(database));
}
export function createIdentity(store: IdentityRepository, config: ApiConfig) {
  return new IdentityHttpAdapter(new IdentityService(store, identityCrypto, { now: () => new Date() }, {
    revokedSessions: new Subject<string>(), deletedAccounts: new Subject<string>(),
  }), config);
}
