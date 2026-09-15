import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { configureHttp } from '../src/platform/http/configure-http';
import { IdentityStore } from '../src/modules/identity/identity.store';
import { hashPassword, verifyPassword } from '../src/modules/identity/password';
import { seedCredentials } from '../src/modules/identity/seed';
import { sessionHash } from '../src/modules/identity/identity.service';

type Account = { id: string; email: string; role: 'wanderer' | 'pine_keeper'; passwordHash: string; createdAt: Date };
type Session = { tokenHash: string; accountId: string | null; csrfToken: string; expiresAt: Date };
// Test-only persistence adapter. Production always uses PostgreSQL via IdentityStore.
class MemoryStore {
  accounts: Account[] = [];
  sessions = new Map<string, Session>();
  async findAccount(email: string) { return this.accounts.find(value => value.email === email); }
  async createAccount(email: string, passwordHash: string) {
    if (await this.findAccount(email)) return undefined;
    const value: Account = { id: randomUUID(), email, role: 'wanderer', passwordHash, createdAt: new Date() };
    this.accounts.push(value); return value;
  }
  async findSession(hash: string) {
    const session = this.sessions.get(hash);
    if (!session || session.expiresAt <= new Date()) return undefined;
    const owner = this.accounts.find(value => value.id === session.accountId);
    return { session, user: owner ? { id: owner.id, email: owner.email, role: owner.role } : null };
  }
  async rotateSession(old: string | undefined, value: Session) { if (old) this.sessions.delete(old); this.sessions.set(value.tokenHash, value); }
  async revoke(hash: string) { this.sessions.delete(hash); }
  async listAccounts(offset: number) { return this.accounts.slice(offset, offset + 51).map(({ passwordHash: _, ...value }) => value); }
}
const password = 'test-only-long-password';
const origin = 'http://127.0.0.1:5173';
async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const store = new MemoryStore();
  const config = readApiConfig({ API_WEB_ORIGIN: origin });
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(API_CONFIG).useValue(config)
    .overrideProvider(IdentityStore).useValue(store).compile();
  const app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
  configureHttp(app, config); await app.init(); t.after(() => app.close());
  const server = app.getHttpServer();
  const agent = request.agent(server);
  const anon = await agent.get('/api/v1/auth/session').expect(200);
  const register = (email: string) => agent.post('/api/v1/auth/register').set('Origin', origin).set('X-XSRF-TOKEN', anon.body.csrfToken).send({ email, password });
  return { store, server, agent, anon, register };
}
test('registration normalizes email, rotates session, restricts role and returns safe DTO', async t => {
  const { agent, anon, register, store } = await setup(t);
  const result = await register('  Wanderer@Example.test ').expect(201);
  assert.equal(result.body.user.email, 'wanderer@example.test');
  assert.equal(result.body.user.role, 'wanderer');
  assert.notEqual(result.body.csrfToken, anon.body.csrfToken);
  assert.ok(!JSON.stringify(result.body).includes('password'));
  const cookie = result.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/);
  assert.notEqual(cookie, anon.headers['set-cookie'][0]);
  assert.equal(store.sessions.size, 1);
  assert.ok(!store.sessions.has(cookie.split(';')[0].split('=')[1]));
  const current = await agent.get('/api/v1/auth/session').expect(200);
  assert.equal(current.body.user.id, result.body.user.id);
  await agent.post('/api/v1/auth/logout').set('Origin', origin).set('X-XSRF-TOKEN', anon.body.csrfToken).expect(403);
  await agent.post('/api/v1/auth/register').set('Origin', origin).set('X-XSRF-TOKEN', result.body.csrfToken)
    .send({ email: 'other@example.test', password, role: 'pine_keeper' }).expect(400);
  await agent.post('/api/v1/auth/register').set('Origin', origin).set('X-XSRF-TOKEN', result.body.csrfToken)
    .send({ email: 'WANDERER@example.test', password }).expect(409);
});
test('CSRF rejects absent, forged, stale tokens and foreign origins without registering', async t => {
  const { agent, anon, store } = await setup(t);
  for (const headers of [{}, { Origin: origin, 'X-XSRF-TOKEN': '0'.repeat(64) }, { Origin: 'https://evil.test', 'X-XSRF-TOKEN': anon.body.csrfToken }]) {
    await agent.post('/api/v1/auth/register').set(headers).send({ email: 'nobody@example.test', password }).expect(403);
  }
  assert.equal(store.accounts.length, 0);
});
test('login errors do not disclose account existence; logout and expiry revoke access', async t => {
  const { agent, store, server, register } = await setup(t);
  const signed = await register('owner@example.test').expect(201);
  const cookie = signed.headers['set-cookie'][0].split(';')[0];
  const csrf = signed.body.csrfToken;
  const wrong = await agent.post('/api/v1/auth/login').set('Origin', origin).set('X-XSRF-TOKEN', csrf).send({ email: 'owner@example.test', password: 'a-wrong-long-password' }).expect(401);
  const missing = await agent.post('/api/v1/auth/login').set('Origin', origin).set('X-XSRF-TOKEN', csrf).send({ email: 'missing@example.test', password }).expect(401);
  assert.equal(wrong.body.message, missing.body.message);
  const logged = await agent.post('/api/v1/auth/login').set('Origin', origin).set('X-XSRF-TOKEN', csrf).send({ email: 'owner@example.test', password }).expect(200);
  await request(server).get('/api/v1/admin/accounts').set('Cookie', cookie).expect(401);
  await agent.post('/api/v1/auth/logout').set('Origin', origin).set('X-XSRF-TOKEN', logged.body.csrfToken).expect(204);
  await request(server).get('/api/v1/admin/accounts').set('Cookie', logged.headers['set-cookie'][0].split(';')[0]).expect(401);
  const anon = await agent.get('/api/v1/auth/session').expect(200);
  const relogged = await agent.post('/api/v1/auth/login').set('Origin', origin).set('X-XSRF-TOKEN', anon.body.csrfToken).send({ email: 'owner@example.test', password }).expect(200);
  const token = relogged.headers['set-cookie'][0].split(';')[0].split('=')[1];
  store.sessions.get(sessionHash(token))!.expiresAt = new Date(0);
  await agent.get('/api/v1/admin/accounts').expect(401);
});
test('RBAC is server enforced, reads fresh roles and does not leak credentials', async t => {
  const { agent, store, server, register } = await setup(t);
  await request(server).get('/api/v1/admin/accounts').set('X-User-ID', 'admin').set('Authorization', 'Bearer admin').expect(401);
  await register('keeper@example.test').expect(201);
  await agent.get('/api/v1/admin/accounts').expect(403);
  store.accounts[0].role = 'pine_keeper';
  const response = await agent.get('/api/v1/admin/accounts').expect(200);
  assert.equal(response.body.entries[0].email, 'keeper@example.test');
  assert.ok(!JSON.stringify(response.body).includes('passwordHash'));
  await agent.get('/api/v1/admin/accounts?offset=-1').expect(400);
  store.accounts[0].role = 'wanderer';
  await agent.get('/api/v1/admin/accounts').expect(403);
  const other = request.agent(server);
  const anon = await other.get('/api/v1/auth/session').expect(200);
  const second = await other.post('/api/v1/auth/register').set('Origin', origin).set('X-XSRF-TOKEN', anon.body.csrfToken).send({ email: 'second@example.test', password }).expect(201);
  const first = await agent.get('/api/v1/auth/session').expect(200);
  assert.notEqual(first.body.user.id, second.body.user.id);
  assert.equal(first.body.user.email, 'keeper@example.test');
});
test('password hashing and seed validation do not accept weak or missing credentials', async () => {
  const encoded = await hashPassword(password);
  assert.notEqual(encoded, await hashPassword(password));
  assert.ok(await verifyPassword(password, encoded));
  assert.equal(await verifyPassword('wrong', encoded), false);
  assert.throws(() => seedCredentials({}));
  assert.throws(() => seedCredentials({ PINE_KEEPER_EMAIL: 'keeper@example.test', PINE_KEEPER_PASSWORD: 'short' }));
  assert.equal(seedCredentials({ PINE_KEEPER_EMAIL: ' KEEPER@example.test ', PINE_KEEPER_PASSWORD: password }).email, 'keeper@example.test');
});
test('auth requests are rate limited', async t => {
  const { agent } = await setup(t);
  for (let count = 0; count < 19; count++) await agent.get('/api/v1/auth/session').expect(200);
  await agent.get('/api/v1/auth/session').expect(429);
});
