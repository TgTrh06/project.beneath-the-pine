import { BusinessError } from '../src/shared/kernel/business-error';
import { IDENTITY_ACCESS } from '../src/modules/identity/public-api';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { Test } from '@nestjs/testing';
import { realtimeEvents } from '@pyneath/contracts';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { PineSocketAdapter } from '../src/platform/realtime/socket.adapter';
import { createIdentity } from './helpers/module-fixtures';
import { sessionHash } from '../src/modules/identity/infrastructure/identity-crypto';
import type { IdentityRepository } from '../src/modules/identity/application/identity.ports';
import { FOCUS_ACCESS } from '../src/modules/focus/public-api';
import { PREFERENCES_ACCESS } from '../src/modules/preferences/public-api';
import { PresenceGateway } from '../src/modules/presence/presentation/presence.gateway';
import type { Request, Response } from 'express';

const account = { id: '9e52c17c-999d-4add-88b7-89c1b63a79ef', email: 'fixture@example.test' };
const sessionId = 'f9194eb2-3b02-47da-97fe-9ac81a6095ca';
const tokenA = 'a'.repeat(64), tokenB = 'b'.repeat(64);
const wait = <T = unknown>(socket: Socket, event: string) => new Promise<T>((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out: ${event}`)), 3000);
  socket.once(event, value => { clearTimeout(timer); resolve(value); });
});
async function setup(t: TestContext, ttl = 60000) {
  const config = readApiConfig({});
  const sessions = new Map([tokenA, tokenB].map(token => [sessionHash(token), { account, session: { expiresAt: new Date(Date.now() + ttl) } }]));
  let unavailable = false, writes = 0;
  const store = {
    findSession: async (hash: string) => { if (unavailable) throw new Error('private connection secret'); return sessions.get(hash); },
    revoke: async (hash: string) => { sessions.delete(hash); },
    rotateSession: async (hash: string) => { sessions.delete(hash); },
  };
  const identity = createIdentity(store as unknown as IdentityRepository, config);
  const focus = {
    changes: new Subject<string>(), presenceChanges: new Subject<{ sessionId: string; accountId: string; presence: 'break' }>(),
    snapshot: async () => ({ id: sessionId, status: 'active', intention: 'private fixture', participants: [{ accountId: account.id, presence: 'break' }] }),
    markConnected: async () => { writes++; }, setPresence: async () => { writes++; },
  };
  const module = await Test.createTestingModule({ providers: [PresenceGateway,
    { provide: IDENTITY_ACCESS, useValue: identity.core }, { provide: FOCUS_ACCESS, useValue: focus },
    { provide: PREFERENCES_ACCESS, useValue: { presenceSharingChanges: new Subject<string>() } }, { provide: API_CONFIG, useValue: config },
  ] }).compile();
  const app = module.createNestApplication({ logger: false });
  app.useWebSocketAdapter(new PineSocketAdapter(app, config)); await app.listen(0, '127.0.0.1');
  const clients: Socket[] = [];
  t.after(async () => { clients.forEach(client => client.close()); await app.close(); });
  const open = (token = tokenA) => {
    const socket = io(`http://127.0.0.1:${app.getHttpServer().address().port}/realtime`, { transports: ['websocket'], reconnection: false,
      extraHeaders: { Origin: config.API_WEB_ORIGIN, Cookie: `PYNEATH_SESSION=${token}` } });
    clients.push(socket); return socket;
  };
  const connect = async (token = tokenA) => { const socket = open(token); await wait(socket, 'connect'); return socket; };
  const subscribe = async (socket: Socket) => { const value = wait(socket, realtimeEvents.snapshot); socket.emit(realtimeEvents.subscribe, { sessionId }); await value; };
  return { identity, focus, sessions, open, connect, subscribe, writes: () => writes, outage: () => { unavailable = true; } };
}
const request = (token = tokenA) => ({ headers: { cookie: `PYNEATH_SESSION=${token}` } }) as Request;
const response = { cookie: () => undefined, clearCookie: () => undefined } as unknown as Response;

test('logout disconnects every socket for that session but preserves another session', async t => {
  const h = await setup(t); const a = await h.connect(), a2 = await h.connect(), b = await h.connect(tokenB);
  await h.subscribe(a); await h.subscribe(a2); await h.subscribe(b);
  const ended = [wait(a, 'disconnect'), wait(a2, 'disconnect')];
  await h.identity.logout(request(), response); await Promise.all(ended);
  assert.equal(b.connected, true); await h.subscribe(b);
  const denied = h.open(); await wait(denied, 'connect_error');
});
test('rotation and account deletion disconnect only the intended credentials', async t => {
  const h = await setup(t); const a = await h.connect(), b = await h.connect(tokenB);
  const rotated = wait(a, 'disconnect'); await h.identity.issue(request(), response, account); await rotated;
  assert.equal(b.connected, true);
  const deleted = wait(b, 'disconnect'); h.sessions.clear(); h.identity.core.notifyAccountDeleted(account.id); await deleted;
});
test('expiry disconnects an idle socket without waiting for a heartbeat', async t => {
  const h = await setup(t, 600); const a = await h.connect();
  const error = wait<{ code: string }>(a, realtimeEvents.error), ended = wait(a, 'disconnect');
  assert.equal((await error).code, 'UNAUTHENTICATED'); await ended;
});
for (const event of [realtimeEvents.subscribe, realtimeEvents.heartbeat, realtimeEvents.setPresence]) {
  test(`database revocation prevents ${event} without an in-process notification`, async t => {
    const h = await setup(t); const a = await h.connect(); await h.subscribe(a); const before = h.writes();
    h.sessions.clear();
    const error = wait<{ code: string }>(a, realtimeEvents.error), ended = wait(a, 'disconnect');
    a.emit(event, { sessionId, ...(event === realtimeEvents.setPresence ? { presence: 'break' } : {}) });
    assert.equal((await error).code, 'UNAUTHENTICATED'); await ended; assert.equal(h.writes(), before);
  });
}
for (const kind of ['snapshot', 'presence', 'outage', 'changed-owner'] as const) {
  test(`server push fails closed for ${kind}`, async t => {
    const h = await setup(t); const a = await h.connect(); await h.subscribe(a);
    let leaked = 0; a.on(realtimeEvents.sessionUpdated, () => leaked++); a.on(realtimeEvents.presenceUpdated, () => leaked++);
    if (kind === 'outage') h.outage();
    else if (kind === 'changed-owner') h.sessions.set(sessionHash(tokenA), { account: { ...account, id: 'other' }, session: { expiresAt: new Date(Date.now() + 60000) } });
    else h.sessions.clear();
    const error = wait<{ code: string }>(a, realtimeEvents.error), ended = wait(a, 'disconnect');
    if (kind === 'presence') h.focus.presenceChanges.next({ sessionId, accountId: account.id, presence: 'break' });
    else h.focus.changes.next(sessionId);
    assert.equal((await error).code, kind === 'outage' ? 'SERVICE_UNAVAILABLE' : 'UNAUTHENTICATED');
    await ended; assert.equal(leaked, 0);
  });
}

for (const event of [realtimeEvents.subscribe, realtimeEvents.heartbeat, realtimeEvents.setPresence]) {
  test(`database outage prevents ${event} from writing presence`, async t => {
    const h = await setup(t); const a = await h.connect(); await h.subscribe(a); const before = h.writes();
    h.outage();
    const error = wait<{ code: string }>(a, realtimeEvents.error), ended = wait(a, 'disconnect');
    a.emit(event, { sessionId, ...(event === realtimeEvents.setPresence ? { presence: 'break' } : {}) });
    assert.equal((await error).code, 'SERVICE_UNAVAILABLE'); await ended; assert.equal(h.writes(), before);
  });
}

for (const code of ['NOT_FOUND', 'FORBIDDEN', 'STATE_CONFLICT'] as const) {
  test(`application ${code} preserves the socket error and removes the room subscription`, async t => {
    const h = await setup(t), socket = await h.connect();
    await h.subscribe(socket);
    let attempts = 0;
    h.focus.setPresence = async () => { attempts++; throw new BusinessError(code); };
    const error = wait<{ code: string }>(socket, realtimeEvents.error);
    socket.emit(realtimeEvents.setPresence, { sessionId, presence: 'break' });
    assert.equal((await error).code, code === 'STATE_CONFLICT' ? 'CONFLICT' : code);
    const unsubscribed = wait<{ code: string }>(socket, realtimeEvents.error);
    socket.emit(realtimeEvents.setPresence, { sessionId, presence: 'break' });
    assert.equal((await unsubscribed).code, 'FORBIDDEN');
    assert.equal(attempts, 1, 'removed room no longer dispatches presence writes');
  });
}
