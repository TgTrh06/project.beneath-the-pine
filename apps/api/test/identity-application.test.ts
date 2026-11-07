import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Subject } from 'rxjs';
import type { Request, Response } from 'express';
import { IdentityService } from '../src/modules/identity/application/identity.service';
import type { IdentityCrypto, IdentityRepository } from '../src/modules/identity/application/identity.ports';
import { IdentityHttpAdapter } from '../src/modules/identity/presentation/identity-http.adapter';
import { readApiConfig } from '../src/platform/config/api-config';
import { BusinessError } from '../src/shared/kernel/business-error';

const oldToken = 'a'.repeat(64), nextToken = 'b'.repeat(64), csrfToken = 'c'.repeat(64);
const now = new Date('2026-11-07T00:00:00Z');
function setup(rotateSession: IdentityRepository['rotateSession']) {
  let count = 0;
  const events = { revokedSessions: new Subject<string>(), deletedAccounts: new Subject<string>() };
  const repository: IdentityRepository = {
    findAccount: async () => undefined, createAccount: async () => undefined, findSession: async () => undefined,
    rotateSession, revoke: async () => undefined, deleteAccount: async () => undefined,
  };
  const crypto: IdentityCrypto = { token: () => count++ === 0 ? nextToken : csrfToken,
    hashToken: value => `hash:${value}`, equal: (a, b) => a === b,
    hashPassword: async () => 'fixture-hash', verifyPassword: async () => false,
  };
  const core = new IdentityService(repository, crypto, { now: () => now }, events);
  return { core, repository, crypto, events, http: new IdentityHttpAdapter(core, readApiConfig({})) };
}

test('rotation failure produces neither a revocation event nor a replacement cookie', async () => {
  const fixture = setup(async () => { throw new Error('fixture transaction rollback'); });
  const notifications: string[] = [], cookies: unknown[] = [];
  fixture.events.revokedSessions.subscribe(value => notifications.push(value));
  const response = { cookie: (...value: unknown[]) => cookies.push(value), clearCookie: (...value: unknown[]) => cookies.push(value) } as unknown as Response;
  await assert.rejects(fixture.http.issue({ headers: { cookie: `PYNEATH_SESSION=${oldToken}` } } as Request, response, { id: 'owner', email: 'fixture@example.test' }));
  assert.deepEqual(notifications, []); assert.deepEqual(cookies, []);
});

test('successful rotation persists expiry before publishing revocation and returning safe account data', async () => {
  const order: string[] = [];
  const fixture = setup(async (oldHash, value) => {
    assert.equal(oldHash, `hash:${oldToken}`);
    assert.deepEqual(value, { tokenHash: `hash:${nextToken}`, csrfToken, accountId: 'owner', expiresAt: new Date(now.getTime() + 7 * 86400000) });
    order.push('committed');
  });
  fixture.events.revokedSessions.subscribe(() => order.push('revoked'));
  const result = await fixture.core.issue(oldToken, { id: 'owner', email: 'fixture@example.test' });
  assert.deepEqual(order, ['committed', 'revoked']);
  assert.deepEqual(result.response, { authenticated: true, account: { id: 'owner', email: 'fixture@example.test' }, csrfToken });
});

test('unknown-account login still runs dummy password verification and exposes only the auth error', async () => {
  const fixture = setup(async () => undefined);
  let checks = 0;
  fixture.crypto.verifyPassword = async (_password, encoded) => { checks++; assert.equal(encoded, undefined); return false; };
  await assert.rejects(fixture.core.login('missing@example.test', 'private-password'), error => error instanceof BusinessError && error.code === 'UNAUTHENTICATED');
  assert.equal(checks, 1);
});

test('failed revocation emits no event and duplicate valid logout tokens are processed once', async () => {
  const fixture = setup(async () => undefined), events: string[] = [];
  fixture.events.revokedSessions.subscribe(value => events.push(value));
  fixture.repository.revoke = async () => { throw new Error('fixture unavailable'); };
  await assert.rejects(fixture.core.logout([oldToken])); assert.deepEqual(events, []);
  let writes = 0; fixture.repository.revoke = async () => { writes++; };
  await fixture.core.logout([oldToken, undefined, oldToken, 'invalid']);
  assert.equal(writes, 1); assert.deepEqual(events, [`hash:${oldToken}`]);
});
