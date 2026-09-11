import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { readConfig } from '../src/shared/config';
import { Database } from '../src/shared/database/database.module';
import { AccountRepository } from '../src/identity/application/account.repository';
import { TaskRepository } from '../src/task/application/task.repository';

export function httpSuite(name: string, setup: () => Promise<{
  database: Database; accounts: AccountRepository; tasks: TaskRepository; cleanup: () => Promise<void>;
}>, skip = false) {
  test(name, { skip }, async t => {
    const fixture = await setup();
    t.after(fixture.cleanup);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Database).useValue(fixture.database)
      .overrideProvider(AccountRepository).useValue(fixture.accounts)
      .overrideProvider(TaskRepository).useValue(fixture.tasks).compile();
    const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
    configureApp(app, readConfig({ NODE_ENV: 'test', SESSION_TIMEOUT: '30m' }));
    await app.init();
    t.after(() => app.close());
    const server = app.getHttpServer();
    const alice = request.agent(server);
    const bob = request.agent(server);
    const password = 'a-secure-passphrase';
    const email = `alice-${Date.now()}@example.test`;
    let aliceToken = '';
    let bobToken = '';
    let aliceId = '';
    let taskId = '';

    await t.test('public liveness, protected routes, request IDs and cache/security headers', async () => {
      await request(server).get('/actuator/health/liveness').expect(200, { status: 'UP' });
      const response = await request(server).get('/api/v1/system/auth-check').set('X-Request-ID', 'test-request-123').expect(401);
      assert.equal(response.body.code, 'UNAUTHENTICATED');
      assert.equal(response.body.requestId, 'test-request-123');
      assert.equal(response.headers['x-request-id'], 'test-request-123');
      assert.equal(response.headers['cache-control'], 'no-store');
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      const generated = await request(server).get('/api/v1/tasks').set('X-Request-ID', 'bad id').expect(401);
      assert.match(generated.headers['x-request-id'], /^[0-9a-f-]{36}$/);
    });

    await t.test('CORS allows only the configured web origin with credentials', async () => {
      const allowed = await request(server).options('/api/v1/tasks').set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'PATCH').expect(204);
      assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
      assert.equal(allowed.headers['access-control-allow-credentials'], 'true');
      const denied = await request(server).get('/api/v1/auth/session').set('Origin', 'https://other.example');
      assert.notEqual(denied.headers['access-control-allow-origin'], 'https://other.example');
    });

    await t.test('CSRF is required on register and login, including anonymous requests', async () => {
      for (const path of ['register', 'login', 'logout']) {
        const response = await request(server).post(`/api/v1/auth/${path}`).send({ email, password }).expect(403);
        assert.equal(response.body.code, 'FORBIDDEN');
      }
      const session = await alice.get('/api/v1/auth/session').expect(200);
      assert.equal(session.body.authenticated, false);
      assert.equal(session.body.user, null);
      aliceToken = session.body.csrfToken;
      assert.ok(aliceToken);
      bobToken = (await bob.get('/api/v1/auth/session').expect(200)).body.csrfToken;
      await bob.post('/api/v1/auth/register').set('X-XSRF-TOKEN', aliceToken).send({ email, password }).expect(403);
    });

    await t.test('credential validation rejects malformed email, short/blank passwords and BCrypt overflow', async () => {
      for (const body of [{ email: 'invalid', password }, { email, password: 'short' },
        { email, password: ' '.repeat(12) }, { email, password: 'é'.repeat(40) }]) {
        const response = await alice.post('/api/v1/auth/register').set('X-XSRF-TOKEN', aliceToken).send(body).expect(400);
        assert.equal(response.body.code, 'VALIDATION_FAILED');
        assert.ok(!JSON.stringify(response.body).includes(body.password));
      }
    });

    await t.test('register normalizes email, hashes credentials, rotates session and CSRF', async () => {
      const oldSession = await alice.get('/api/v1/auth/session');
      const oldCookie = oldSession.headers['set-cookie'][0].split(';')[0];
      const oldToken = aliceToken;
      const response = await alice.post('/api/v1/auth/register').set('X-XSRF-TOKEN', aliceToken)
        .send({ email: `  ${email.toUpperCase()}  `, password }).expect(201);
      aliceToken = response.body.csrfToken;
      aliceId = response.body.user.id;
      assert.notEqual(aliceToken, oldToken);
      assert.equal(response.body.user.email, email);
      const cookie = response.headers['set-cookie'][0];
      assert.notEqual(cookie.split(';')[0], oldCookie);
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=Lax/);
      await request(server).get('/api/v1/system/auth-check').set('Cookie', oldCookie).expect(401);
      await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', oldToken).send({ title: 'Open notebook', minutes: 5 }).expect(403);
      const account = await fixture.accounts.findByEmail(email);
      assert.match(account!.passwordHash, /^\$2[ab]\$12\$/);
      assert.ok(!JSON.stringify(response.body).includes('password'));
      await alice.get('/api/v1/system/auth-check').expect(200, { authenticated: true, subject: aliceId, email });
    });

    await t.test('duplicate account and generic login failures retain safe errors', async () => {
      const duplicate = await bob.post('/api/v1/auth/register').set('X-XSRF-TOKEN', bobToken).send({ email, password }).expect(409);
      assert.equal(duplicate.body.code, 'ACCOUNT_ALREADY_EXISTS');
      for (const loginEmail of [email, 'missing@example.test']) {
        const bad = await bob.post('/api/v1/auth/login').set('X-XSRF-TOKEN', bobToken)
          .send({ email: loginEmail, password: 'wrong-secure-passphrase' }).expect(401);
        assert.equal(bad.body.code, 'INVALID_CREDENTIALS');
        assert.equal(bad.body.message, 'The email or password is incorrect.');
      }
      const registered = await bob.post('/api/v1/auth/register').set('X-XSRF-TOKEN', bobToken)
        .send({ email: `bob-${Date.now()}@example.test`, password }).expect(201);
      bobToken = registered.body.csrfToken;
    });

    await t.test('malformed JSON and oversized requests use the shared safe envelope', async () => {
      const bad = await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', aliceToken)
        .set('Content-Type', 'application/json').send('{"title":').expect(400);
      assert.equal(bad.body.code, 'MALFORMED_JSON');
      const huge = await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', aliceToken)
        .send({ title: 'x'.repeat(40_000), minutes: 3 }).expect(413);
      assert.equal(huge.body.code, 'PAYLOAD_TOO_LARGE');
    });

    await t.test('next-action response matches the browser contract and ignores injected ownership', async () => {
      const response = await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', aliceToken)
        .send({ title: '  Open notebook  ', minutes: 5, userId: 'forged-owner' }).expect(201);
      taskId = response.body.task.id;
      assert.equal(response.body.task.title, 'Open notebook');
      assert.equal(response.body.task.status, 'ready');
      assert.equal(response.body.task.userId, aliceId);
      assert.equal(response.body.task.sourceBrainDumpId, null);
      assert.deepEqual(response.body.nextAction, { taskId, title: 'Open notebook', minutes: 5, confirmedAt: response.body.task.createdAt });
      const tasks = await alice.get('/api/v1/tasks?status=ready&limit=10').expect(200);
      assert.equal(tasks.body.tasks.length, 1);
    });

    await t.test('other users cannot read, modify, archive or list owned tasks', async () => {
      await bob.get('/api/v1/tasks').expect(200, { tasks: [] });
      const hidden = await bob.get(`/api/v1/tasks/${taskId}`).expect(404);
      assert.equal(hidden.body.code, 'TASK_NOT_FOUND');
      await bob.patch(`/api/v1/tasks/${taskId}`).set('X-XSRF-TOKEN', bobToken).send({ title: 'Stolen task' }).expect(404);
      await bob.post(`/api/v1/tasks/${taskId}/archive`).set('X-XSRF-TOKEN', bobToken).expect(404);
      await alice.get(`/api/v1/tasks/${taskId}`).expect(200);
    });

    await t.test('invalid task bodies, UUIDs and list filters fail safely', async () => {
      for (const body of [{ title: 'Valid title', minutes: 11 }, { title: 'x', minutes: 1 },
        { title: 'Valid title', minutes: 1.5 }, { title: 'Valid title', minutes: 2, sourceBrainDumpId: 'bad' }]) {
        await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', aliceToken).send(body).expect(400);
      }
      const whitespace = await alice.post('/api/v1/next-actions').set('X-XSRF-TOKEN', aliceToken).send({ title: '   ', minutes: 1 }).expect(400);
      assert.equal(whitespace.body.code, 'INVALID_TASK');
      for (const body of [{}, { status: 'archived' }, { title: null, minutes: null, status: null }]) {
        const bad = await alice.patch(`/api/v1/tasks/${taskId}`).set('X-XSRF-TOKEN', aliceToken).send(body).expect(400);
        assert.equal(bad.body.code, 'VALIDATION_FAILED');
      }
      for (const query of ['limit=101', 'limit=-1', 'limit=abc', 'status=invalid']) await alice.get(`/api/v1/tasks?${query}`).expect(400);
      await alice.get('/api/v1/tasks/not-a-uuid').expect(400);
    });

    await t.test('update and archive preserve the terminal state', async () => {
      await alice.patch(`/api/v1/tasks/${taskId}`).send({ status: 'done' }).expect(403);
      const updated = await alice.patch(`/api/v1/tasks/${taskId}`).set('X-XSRF-TOKEN', aliceToken)
        .send({ title: 'Write one line', minutes: 3, status: 'done' }).expect(200);
      assert.equal(updated.body.status, 'done');
      assert.equal(updated.body.title, 'Write one line');
      const archived = await alice.post(`/api/v1/tasks/${taskId}/archive`).set('X-XSRF-TOKEN', aliceToken).expect(200);
      assert.equal(archived.body.status, 'archived');
      const rejected = await alice.patch(`/api/v1/tasks/${taskId}`).set('X-XSRF-TOKEN', aliceToken).send({ status: 'ready' }).expect(409);
      assert.equal(rejected.body.code, 'TASK_ARCHIVED');
      await alice.post(`/api/v1/tasks/${taskId}/archive`).set('X-XSRF-TOKEN', aliceToken).expect(409);
    });

    await t.test('logout invalidates the old cookie; login establishes a fresh session', async () => {
      const oldCookie = (await alice.get('/api/v1/auth/session')).headers['set-cookie'][0].split(';')[0];
      await alice.post('/api/v1/auth/logout').set('X-XSRF-TOKEN', aliceToken).expect(204);
      await alice.get('/api/v1/system/auth-check').expect(401);
      await request(server).get('/api/v1/system/auth-check').set('Cookie', oldCookie).expect(401);
      aliceToken = (await alice.get('/api/v1/auth/session')).body.csrfToken;
      const loggedIn = await alice.post('/api/v1/auth/login').set('X-XSRF-TOKEN', aliceToken).send({ email, password }).expect(200);
      assert.equal(loggedIn.body.user.id, aliceId);
      assert.notEqual(loggedIn.body.csrfToken, aliceToken);
    });
  });
}

export async function assertExpiredSession(app: NestExpressApplication) {
  const agent = request.agent(app.getHttpServer());
  const first = await agent.get('/api/v1/auth/session');
  await setTimeout(1100);
  await agent.post('/api/v1/auth/register').set('X-XSRF-TOKEN', first.body.csrfToken)
    .send({ email: 'expired@example.test', password: 'a-secure-passphrase' }).expect(403);
}
