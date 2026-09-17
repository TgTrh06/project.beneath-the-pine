import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { realtimeEvents } from '@beneath-the-pine/contracts';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { PineSocketAdapter } from '../src/platform/realtime/socket.adapter';
import { IdentityService } from '../src/modules/identity/identity.service';
import { FocusService } from '../src/modules/focus/focus.service';
import { PresenceGateway } from '../src/modules/presence/presence.gateway';

const waitFor = <T>(socket: Socket, event: string) => new Promise<T>((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Timed out: ${event}`)), 2000); socket.once(event, value => { clearTimeout(timer); resolve(value); }); });
test('realtime authenticates Origin/session, authorizes subscribe and returns durable snapshot', async t => {
  const origin = 'http://127.0.0.1:5173'; const config = readApiConfig({ API_WEB_ORIGIN: origin }); const changes = new Subject<string>(); const calls: string[] = [];
  const snapshot = { id: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca', kind: 'solo', pactId: null, status: 'active', startedAt: new Date(), endsAt: new Date(Date.now()+60000), serverNow: new Date(), intention: 'private', participants: [] };
  const identity = { sessionFromCookie: async (cookie?: string) => {
    // A real database lookup completes after Socket.IO has begun connecting.
    await new Promise(resolve => setTimeout(resolve, 50));
    return cookie === 'BTP_SESSION=valid' ? { account: { id: '9e52c17c-999d-4add-88b7-89c1b63a79ef', email: 'member@example.test' } } : undefined;
  } };
  const focus = { changes, snapshot: async (id: string) => { calls.push(id); return snapshot; }, setPresence: async () => undefined };
  const module = await Test.createTestingModule({ providers: [PresenceGateway, { provide: IdentityService, useValue: identity }, { provide: FocusService, useValue: focus }, { provide: API_CONFIG, useValue: config }] }).compile();
  const app = module.createNestApplication<NestExpressApplication>(); app.useWebSocketAdapter(new PineSocketAdapter(app, config)); await app.listen(0, '127.0.0.1'); t.after(() => app.close()); const address = app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('No test port'); const url = `http://127.0.0.1:${address.port}/realtime`;
  const client = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: origin, Cookie: 'BTP_SESSION=valid' } }); t.after(() => client.close()); await waitFor(client, 'connect'); client.emit(realtimeEvents.subscribe, { sessionId: snapshot.id }); const received = await waitFor<{ id: string; intention: string }>(client, realtimeEvents.snapshot); assert.equal(received.id, snapshot.id); assert.equal(received.intention, 'private'); assert.deepEqual(calls, [snapshot.id]);
  const denied = io(url, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: 'https://evil.test', Cookie: 'BTP_SESSION=valid' } }); t.after(() => denied.close()); await waitFor(denied, 'connect_error');
});
