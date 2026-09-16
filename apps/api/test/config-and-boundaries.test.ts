import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { readApiConfig, ConfigError } from '../src/platform/config/api-config';

const { boundaryError, checkBoundaries } = require('../../scripts/check-boundaries.cjs') as {
  boundaryError(source: string, target: string): string | undefined;
  checkBoundaries(root: string): { files: number; errors: string[] };
};

test('API config is isolated from legacy environment, with bounded values and redacted errors', () => {
  const config = readApiConfig({ SERVER_PORT: '8080', DATABASE_URL: 'legacy-secret' });
  assert.equal(config.API_PORT, 8081);
  assert.equal(config.API_HOST, '127.0.0.1');
  assert.equal(config.API_DATABASE_URL, undefined);
  for (const invalid of [
    { API_PORT: '0' }, { API_PORT: '65536' }, { API_HOST: 'arbitrary-host' },
    { API_DB_POOL_MAX: '5000' }, { API_DB_TIMEOUT_MS: '0' },
    { API_WEB_ORIGIN: 'not-a-url' }, { API_WEB_ORIGIN: 'https://example.test/path' },
    { API_DATABASE_URL: 'not-a-url-private-secret' }, { API_DATABASE_URL: 'https://private-secret@example.test' },
    { API_LOG_LEVEL: 'trace' },
  ]) {
    assert.throws(() => readApiConfig(invalid), error => {
      assert.ok(error instanceof ConfigError);
      assert.ok(!error.message.includes('private-secret'));
      assert.ok(!error.message.includes('example.test'));
      return true;
    });
  }
});

test('module checks reject cross-owner persistence, infrastructure in domain and inward platform imports', () => {
  assert.ok(boundaryError('modules/focus/application/start.ts', 'modules/pact/infrastructure/pact.schema.ts'));
  assert.ok(boundaryError('modules/pact/domain/pact.ts', 'drizzle-orm/pg-core'));
  assert.ok(boundaryError('modules/pact/application/create.ts', '@nestjs/common'));
  assert.ok(boundaryError('platform/http/controller.ts', 'modules/pact/public-api.ts'));
  assert.equal(boundaryError('modules/focus/application/start.ts', 'modules/pact/public-api.ts'), undefined);
  assert.equal(boundaryError('modules/focus/focus.module.ts', 'modules/pact/pact.module.ts'), undefined);
  assert.equal(boundaryError('modules/pact/infrastructure/repository.ts', 'drizzle-orm'), undefined);
  assert.deepEqual(checkBoundaries(resolve(__dirname, '../../src')).errors, []);
});
