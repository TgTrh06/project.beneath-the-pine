const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const normalize = value => value.replace(/\\/g, '/');
const feature = value => value.match(/^features\/([^/]+)\//)?.[1];
const isPublic = value => /^features\/[^/]+\/(?:public|controls|scene)-api\.ts$/.test(value);

function boundaryError(source, target) {
  source = normalize(source); target = normalize(target);
  if (source.startsWith('shared/') && /^(features|app)\//.test(target)) return 'Shared code must not import features or app orchestration';
  if (source.startsWith('features/') && target.startsWith('app/')) return 'Features must not import app orchestration';
  if (feature(target) && feature(source) !== feature(target) && !isPublic(target)) return 'Cross-feature access must use a public feature entry';
}

function checkBoundaries(root) {
  const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(folder, entry.name);
    return entry.isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
  });
  const graph = new Map(), errors = [], heavy = new Set();
  for (const file of walk(root)) {
    const source = normalize(path.relative(root, file)), edges = [];
    const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const inspect = (specifier, eager) => {
      if (/^(three(?:\/|$)|@react-three\/fiber$)/.test(specifier) && eager) heavy.add(source);
      if (!specifier.startsWith('.')) return;
      const base = path.resolve(path.dirname(file), specifier);
      const resolved = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].find(value => fs.existsSync(value) && fs.statSync(value).isFile());
      if (!resolved) { errors.push(`${source}: unresolved ${specifier}`); return; }
      const target = normalize(path.relative(root, resolved));
      const error = boundaryError(source, target);
      if (error) errors.push(`${source} -> ${target}: ${error}`);
      if (eager && /\.tsx?$/.test(target)) edges.push(target);
    };
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        let eager = true;
        if (ts.isImportDeclaration(node) && node.importClause) {
          const bindings = node.importClause.namedBindings;
          eager = !node.importClause.isTypeOnly && (Boolean(node.importClause.name) || !bindings || !ts.isNamedImports(bindings) || bindings.elements.some(item => !item.isTypeOnly));
        }
        if (ts.isExportDeclaration(node)) eager = !node.isTypeOnly && (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some(item => !item.isTypeOnly));
        inspect(node.moduleSpecifier.text, eager);
      }
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) inspect(node.argument.literal.text, false);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) inspect(node.arguments[0].text, false);
        else errors.push(`${source}: computed import cannot be checked`);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree); graph.set(source, edges);
  }
  const done = new Set();
  function cycle(node, stack) {
    if (stack.includes(node)) { errors.push(`Runtime import cycle: ${[...stack, node].join(' -> ')}`); return; }
    if (done.has(node)) return;
    for (const target of graph.get(node) ?? []) cycle(target, [...stack, node]);
    done.add(node);
  }
  for (const node of graph.keys()) cycle(node, []);
  const entryGraph = new Set();
  function reachable(node) {
    if (entryGraph.has(node)) return;
    entryGraph.add(node);
    if (heavy.has(node)) errors.push(`Initial app bundle eagerly imports Three.js/canvas through ${node}`);
    for (const next of graph.get(node) ?? []) reachable(next);
  }
  reachable('main.tsx');
  return { files: graph.size, errors };
}
module.exports = { boundaryError, checkBoundaries };
if (require.main === module) {
  const result = checkBoundaries(path.resolve(__dirname, '../src'));
  if (result.errors.length) { result.errors.forEach(error => console.error(error)); process.exitCode = 1; }
  else console.log(`Web boundaries passed (${result.files} files; no runtime cycles; canvas stays lazy).`);
}
