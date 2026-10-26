const { rmSync } = require('node:fs');
const { resolve, sep } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const output = resolve(projectRoot, 'dist-test');
if (!output.startsWith(projectRoot + sep)) throw new Error('Test output must stay inside the API project');
rmSync(output, { recursive: true, force: true });
