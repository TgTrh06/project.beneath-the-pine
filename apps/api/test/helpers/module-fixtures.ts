import type { IdentityAccess, AccountRemoval } from '../../src/modules/identity/public-api';
import { PrivacyService } from '../../src/modules/privacy/application/privacy.service';
import { DrizzleProfileRepository } from '../../src/modules/profile/infrastructure/profile.repository';
import { DrizzleAccountRepository } from '../../src/modules/identity/infrastructure/account.repository';
import { MemoryService } from '../../src/modules/memory/application/memory.service';
import { DrizzleMemoryRepository } from '../../src/modules/memory/infrastructure/memory.repository';
import { PreferencesService } from '../../src/modules/preferences/application/preferences.service';
import { DrizzlePreferencesRepository } from '../../src/modules/preferences/infrastructure/preferences.repository';
import { DrizzleFocusRepository } from '../../src/modules/focus/infrastructure/focus.repository';
import { SharedMemoryService } from '../../src/modules/memory/application/shared-memory.service';
import { DrizzleSharedMemoryRepository } from '../../src/modules/memory/infrastructure/shared-memory.repository';
import type { PresenceChange } from '../../src/modules/focus/domain/focus';
import { DrizzlePactRepository } from '../../src/modules/pact/infrastructure/pact.repository';
import type { PactAccess } from '../../src/modules/pact/public-api';
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
import { CampService } from '../../src/modules/camp/application/camp.service';
import { DrizzleCampRepository } from '../../src/modules/camp/infrastructure/camp.repository';
import { inviteTokens } from '../../src/modules/camp/infrastructure/invite-tokens';
import { decodeCursor, encodeCursor } from '../../src/platform/http/pagination';
import type { Analytics } from '../../src/modules/analytics/public-api';
import type { CampAccess } from '../../src/modules/camp/public-api';
import { PactService } from '../../src/modules/pact/application/pact.service';
import { FocusService } from '../../src/modules/focus/application/focus.service';

// A fixture database has one transaction owner, just like the NestJS DatabaseModule singleton.
const transactionOwners = new WeakMap<DatabaseService, PostgresUnitOfWork>();
export function transactionsFor(database: DatabaseService) {
  let transactions = transactionOwners.get(database);
  if (!transactions) { transactions = new PostgresUnitOfWork(database); transactionOwners.set(database, transactions); }
  return transactions;
}
export function createCamps(database: DatabaseService, analytics: Analytics) {
  const transactions = transactionsFor(database);
  return new CampService(new DrizzleCampRepository(transactions), transactions, analytics,
    { now: () => new Date() }, inviteTokens, { decode: decodeCursor, encode: encodeCursor });
}
export function createPacts(database: DatabaseService, camps: CampAccess, analytics: Analytics) {
  const transactions = transactionsFor(database);
  return new PactService(new DrizzlePactRepository(transactions), transactions, camps, analytics, { now: () => new Date() }, { decode: decodeCursor, encode: encodeCursor }, createPreferences(database));
}
export function createFocus(database: DatabaseService, pacts: PactAccess, analytics: Analytics) {
  const transactions = transactionsFor(database);
  return new FocusService(new DrizzleFocusRepository(transactions), transactions, createCamps(database, analytics), pacts, createSeeds(database),
    new SharedMemoryService(new DrizzleSharedMemoryRepository(transactions)), analytics, { now: () => new Date() }, { changes: new Subject<string>(), presenceChanges: new Subject<PresenceChange>() });
}

export function createAnalytics(database: DatabaseService) {
  const transactions = transactionsFor(database);
  return new AnalyticsService(new DrizzleAnalyticsRepository(transactions), transactions, { now: () => new Date() }, randomUUID);
}
export function createSeeds(database: DatabaseService) {
  return new SeedService(new DrizzleSeedRepository(transactionsFor(database)), { now: () => new Date() });
}
export function createIdentityStore(database: DatabaseService) {
  return new DrizzleIdentityRepository(transactionsFor(database));
}
export function createIdentity(store: IdentityRepository, config: ApiConfig) {
  return new IdentityHttpAdapter(new IdentityService(store, identityCrypto, { now: () => new Date() }, {
    revokedSessions: new Subject<string>(), deletedAccounts: new Subject<string>(),
  }), config);
}

export function createMemory(database: DatabaseService) {
  const transactions = transactionsFor(database);
  return new MemoryService(new DrizzleMemoryRepository(transactions), transactions, new DrizzleAccountRepository(transactions));
}
export function createPreferences(database: DatabaseService) {
  const transactions = transactionsFor(database);
  return new PreferencesService(new DrizzlePreferencesRepository(transactions), transactions, new DrizzleAccountRepository(transactions), createMemory(database), { now: () => new Date() }, new Subject<string>());
}

export function createPrivacy(database: DatabaseService, identity: IdentityAccess, accountRemoval?: AccountRemoval) {
  const transactions = transactionsFor(database);
  return new PrivacyService({ camps: createCamps(database, createAnalytics(database)), focus: new DrizzleFocusRepository(transactions),
    memory: createMemory(database), pacts: new DrizzlePactRepository(transactions), preferences: createPreferences(database),
    profile: new DrizzleProfileRepository(transactions), seeds: createSeeds(database) },
    accountRemoval ?? new DrizzleAccountRepository(transactions), identity, transactions, { now: () => new Date() });
}
