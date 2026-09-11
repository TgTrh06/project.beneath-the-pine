const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const normalize = value => value.replace(/\\/g, '/');
function boundaryError(source, target) {
  source = normalize(source);
  target = normalize(target);
  const owner = source.match(/^modules\/([^/]+)\//)?.[1];
  const other = target.match(/^modules\/([^/]+)\//)?.[1];
  if (source.startsWith('platform/') && other) return 'Platform must not import business modules';
  if (owner && other && owner !== other) {
    const composition = source.endsWith('.module.ts') && target.endsWith('.module.ts');
    const publicContract = target === `modules/${other}/public-api.ts`;
    if (!composition && !publicContract) return 'Cross-module access must use an explicit public-api.ts contract';
  }
  if (/^modules\/[^/]+\/(domain|application)\//.test(source)) {
    if (target.startsWith('platform/') || /\/(infrastructure|presentation)\//.test(target)
      || /^(?:@nestjs\/|drizzle-orm(?:\/|$)|pg$|express(?:\/|$))/.test(target)) {
      return 'Domain/application must not depend on HTTP, framework or persistence';
    }
  }
  return undefined;
}

function checkBoundaries(root) {
  function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
    });
  }
  const files = walk(root);
  const graph = new Map();
  const errors = [];
  for (const file of files) {
    const source = normalize(path.relative(root, file));
    const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const specifiers = [];
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specifiers.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node)
        && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
        if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) specifiers.push(node.arguments[0].text);
        else errors.push(`${source}: computed imports cannot be checked`);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    const edges = [];
    for (const specifier of specifiers) {
      let target = specifier;
      if (specifier.startsWith('.')) {
        const base = path.resolve(path.dirname(file), specifier);
        const resolved = [base, `${base}.ts`, path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!resolved) { errors.push(`${source}: unresolved ${specifier}`); continue; }
        target = normalize(path.relative(root, resolved));
        if (target.startsWith('../')) errors.push(`${source}: imports outside API src need explicit package contracts`);
        edges.push(target);
      }
      const error = boundaryError(source, target);
      if (error) errors.push(`${source} -> ${target}: ${error}`);
    }
    graph.set(source, edges);
  }
  const done = new Set();
  function visitCycle(node, stack) {
    if (stack.includes(node)) { errors.push(`Import cycle: ${[...stack, node].join(' -> ')}`); return; }
    if (done.has(node)) return;
    for (const next of graph.get(node) ?? []) visitCycle(next, [...stack, node]);
    done.add(node);
  }
  for (const node of graph.keys()) visitCycle(node, []);
  return { files: files.length, errors };
}

module.exports = { boundaryError, checkBoundaries };
if (require.main === module) {
  const result = checkBoundaries(path.resolve(__dirname, '../src'));
  if (result.errors.length) {
    result.errors.forEach(error => console.error(error));
    process.exitCode = 1;
  } else console.log(`Boundary check passed (${result.files} TypeScript files; no import cycles).`);
}
