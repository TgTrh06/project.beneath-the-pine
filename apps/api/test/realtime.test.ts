import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { presenceUpdatedEventSchema, realtimeEvents } from '@beneath-the-pine/contracts';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { PineSocketAdapter } from '../src/platform/realtime/socket.adapter';
import { IdentityService } from '../src/modules/identity/identity.service';
import { FocusService } from '../src/modules/focus/focus.service';
import { focusSessions, sessionParticipants } from '../src/modules/focus/infrastructure/focus.schema';
import { PresenceGateway } from '../src/modules/presence/presence.gateway';

const waitFor = <T>(socket: Socket, event: string) => new Promise<T>((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Timed out: ${event}`)), 2000); socket.once(event, value => { clearTimeout(timer); resolve(value); }); });
test('realtime authenticates Origin/session, authorizes subscribe and returns durable snapshot', async t => {
  const origin = 'http://127.0.0.1:5173'; const config = readApiConfig({ API_WEB_ORIGIN: origin }); const changes = new Subject<string>(); const presenceChanges = new Subject<{ sessionId: string; accountId: string; presence: 'active' | 'break' | 'disconnected' }>(); const calls: string[] = [];
  const accountId = '9e52c17c-999d-4add-88b7-89c1b63a79ef';
  const participant: { accountId: string; displayName: string | null; presence: 'active' | 'break' | 'disconnected' | 'checked_out'; joinedAt: Date; checkedOutAt: Date | null } = { accountId, displayName: 'Member', presence: 'active', joinedAt: new Date(), checkedOutAt: null };
  const snapshot = { id: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca', kind: 'solo', pactId: null, status: 'active', startedAt: new Date(), endsAt: new Date(Date.now()+60000), serverNow: new Date(), intention: 'private', participants: [participant] };
  const identity = { sessionFromCookie: async (cookie?: string) => {
    // A real database lookup completes after Socket.IO has begun connecting.
    await new Promise(resolve => setTimeout(resolve, 50));
    return cookie === 'BTP_SESSION=valid' ? { account: { id: '9e52c17c-999d-4add-88b7-89c1b63a79ef', email: 'member@example.test' } } : undefined;
  } };
  let authorized = true;
  const focus = { changes, presenceChanges, snapshot: async (id: string) => { calls.push(id); if (!authorized) throw new Error('Membership revoked'); return snapshot; }, markConnected: async () => undefined, setPresence: async () => undefined };
  const module = await Test.createTestingModule({ providers: [PresenceGateway, { provide: IdentityService, useValue: identity }, { provide: FocusService, useValue: focus }, { provide: API_CONFIG, useValue: config }] }).compile();
  const app = module.createNestApplication<NestExpressApplication>(); app.useWebSocketAdapter(new PineSocketAdapter(app, config)); await app.listen(0, '127.0.0.1'); t.after(() => app.close()); const address = app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('No test port'); const url = `http://127.0.0.1:${address.port}/realtime`;
  const client = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: origin, Cookie: 'BTP_SESSION=valid' } }); t.after(() => client.close()); await waitFor(client, 'connect'); client.emit(realtimeEvents.subscribe, { sessionId: snapshot.id }); const received = await waitFor<{ id: string; intention: string }>(client, realtimeEvents.snapshot); assert.equal(received.id, snapshot.id); assert.equal(received.intention, 'private'); assert.deepEqual(calls, [snapshot.id,snapshot.id]);
  const second = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: origin, Cookie: 'BTP_SESSION=valid' } }); t.after(() => second.close()); await waitFor(second, 'connect');
  const secondSnapshot = waitFor<{ id: string }>(second, realtimeEvents.snapshot); second.emit(realtimeEvents.subscribe, { sessionId: snapshot.id }); assert.equal((await secondSnapshot).id, snapshot.id);
  const presence = { sessionId: snapshot.id, accountId, presence: 'break' as const };
  participant.presence = 'break';
  const updated = waitFor<unknown>(client, realtimeEvents.presenceUpdated);
  const secondUpdated = waitFor<unknown>(second, realtimeEvents.presenceUpdated);
  presenceChanges.next(presence);
  const [clientEvent, secondEvent] = await Promise.all([updated, secondUpdated]);
  assert.deepEqual(presenceUpdatedEventSchema.parse(clientEvent), presence);
  assert.deepEqual(secondEvent, clientEvent, 'both sockets receive the same minimal participant state');
  assert.deepEqual(Object.keys(clientEvent as object).sort(), ['accountId', 'presence', 'sessionId']);
  let leakedUpdates = 0; client.on(realtimeEvents.presenceUpdated, () => { leakedUpdates++; }); authorized = false;
  participant.presence = 'active';
  presenceChanges.next({ ...presence, presence: 'active' });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(leakedUpdates, 0, 'a socket whose current snapshot is unauthorized receives no presence event');
  authorized = true; snapshot.status = 'completed';
  const terminal = waitFor<{ status: string }>(client, realtimeEvents.snapshot);
  client.emit(realtimeEvents.subscribe, { sessionId: snapshot.id });
  assert.equal((await terminal).status, 'completed', 'an authorized reconnect receives the durable terminal snapshot');
  const denied = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: 'https://evil.test', Cookie: 'BTP_SESSION=valid' } }); t.after(() => denied.close()); await waitFor(denied, 'connect_error');
});

test('focus presence publishes only persisted state transitions', async () => {
  const sessionId = 'f9194eb2-3b02-47da-97fe-9ac81a6095ca'; const accountId = '9e52c17c-999d-4add-88b7-89c1b63a79ef';
  const session = { id: sessionId, pactId: null, circleId: null, status: 'active', endsAt: new Date(Date.now()+60000) };
  let storedPresence: 'active' | 'break' | 'disconnected' | 'checked_out' = 'active';
  const select = () => ({ from: (table: unknown) => ({ where: () => {
    const rows = table === focusSessions ? [session] : table === sessionParticipants ? [{ id: 'participant', presence: storedPresence }] : [];
    return Object.assign(Promise.resolve(rows), { for: async () => rows });
  } }) });
  const db = {
    select,
    transaction: async (run: (tx: any) => Promise<boolean>) => run({
      select,
      update: () => ({ set: (value: { presence: typeof storedPresence }) => ({ where: async () => { storedPresence = value.presence; } }) })
    })
  };
  const focus = new FocusService({ db } as unknown as import('../src/platform/database/database.service').DatabaseService, {} as never, {} as never);
  const emitted: Array<{ sessionId: string; accountId: string; presence: string }> = [];
  focus.presenceChanges.subscribe(value => emitted.push(value));
  await focus.setPresence(sessionId, accountId, 'active');
  await focus.setPresence(sessionId, accountId, 'break');
  await focus.setPresence(sessionId, accountId, 'break');
  assert.deepEqual(emitted, [{ sessionId, accountId, presence: 'break' }]);
});
