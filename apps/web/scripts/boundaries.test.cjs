const { test: it } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { boundaryError, checkBoundaries } = require('./check-boundaries.cjs');

it('rejects inward shared dependencies and private cross-feature imports', () => {
  assert.ok(boundaryError('shared/component.tsx', 'features/memory/public-api.ts'));
  assert.ok(boundaryError('shared/component.tsx', 'app/App.tsx'));
  assert.ok(boundaryError('features/focus/SessionView.tsx', 'app/App.tsx'));
  assert.ok(boundaryError('features/focus/SessionView.tsx', 'features/memory/PersonalForest.tsx'));
  assert.ok(boundaryError('features/focus/SessionView.tsx', 'features/memory/public-api.ts') === undefined);
  assert.ok(boundaryError('features/focus/SessionView.tsx', 'shared/scene/environment.ts') === undefined);
  assert.deepEqual(checkBoundaries(resolve(__dirname, '../src')).errors, []);
});

it('detects barrel imports that make Three.js eager while allowing an explicit lazy canvas', () => {
  const root = mkdtempSync(join(tmpdir(), 'pyneath-web-boundaries-'));
  try {
    mkdirSync(join(root, 'shared'));
    writeFileSync(join(root, 'shared', 'Canvas.tsx'), "import { Canvas } from '@react-three/fiber'; export const Scene = Canvas;");
    writeFileSync(join(root, 'shared', 'index.ts'), "export { Scene } from './Canvas';");
    writeFileSync(join(root, 'main.tsx'), "import { Scene } from './shared/index';");
    assert.ok(checkBoundaries(root).errors.some(error => error.includes('eagerly imports')));
    writeFileSync(join(root, 'main.tsx'), "const Scene = () => import('./shared/Canvas');");
    assert.deepEqual(checkBoundaries(root).errors, []);
    writeFileSync(join(root, 'shared', 'Canvas.tsx'), "import '../main';");
    writeFileSync(join(root, 'main.tsx'), "import './shared/Canvas';");
    assert.ok(checkBoundaries(root).errors.some(error => error.includes('Runtime import cycle')));
  } finally {
    // mkdtemp created this exact fixture path; never remove an inferred workspace path.
    if (resolve(root).startsWith(resolve(tmpdir()) + '\\') || resolve(root).startsWith(resolve(tmpdir()) + '/')) rmSync(root, { recursive: true, force: true });
  }
});
