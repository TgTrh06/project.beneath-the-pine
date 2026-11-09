const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const schemaAccess = require('./schema-access.json');

const normalize = value => value.replace(/\\/g, '/');
function publicExportError(source, target, names) {
  return /^(?:\.\/domain\/|\.\/application\/.+\.ports$|@pyneath\/contracts$)/.test(target)
    ? undefined : 'Public interfaces must export domain data or application ports, not implementations';
}
function boundaryError(source, target) {
  source = normalize(source);
  target = normalize(target);
  const owner = source.match(/^modules\/([^/]+)\//)?.[1];
  const other = target.match(/^modules\/([^/]+)\//)?.[1];
  if (source.startsWith('platform/') && other) return 'Platform must not import business modules';
  if (source.startsWith('shared/kernel/') && (other || target.startsWith('platform/') || /^(?:@nestjs\/|drizzle-orm(?:\/|$)|pg$|express(?:\/|$))/.test(target))) return 'Shared kernel must remain framework-independent';
  if (owner && other && owner !== other) {
    const composition = source.endsWith('.module.ts') && target.endsWith('.module.ts');
    const publicContract = target === `modules/${other}/public-api.ts`;
    const schemaRead = schemaAccess.some(entry => entry.source === source && entry.target === target)
      && source.startsWith(`modules/${owner}/infrastructure/`) && target.endsWith('.schema.ts');
    if (!composition && !publicContract && !schemaRead) return 'Cross-module access must use an explicit public-api.ts contract or inventoried infrastructure schema access';
  }
  if (/^modules\/[^/]+\/(domain|application)\//.test(source)) {
    if (target.startsWith('platform/') || /\/(infrastructure|presentation)\//.test(target)
      || /^(?:@nestjs\/|drizzle-orm(?:\/|$)|pg$|express(?:\/|$))/.test(target)) {
      return 'Domain/application must not depend on HTTP, framework or persistence';
    }
    if (/^modules\/[^/]+\/domain\//.test(source) && /\/(application|presentation|infrastructure)\//.test(target)) return 'Domain must not depend on outer layers';
  }
  return undefined;
}

function crossOwnerWriteErrors(sourceText, importedNames) {
  const tree = ts.createSourceFile('source.ts', sourceText, ts.ScriptTarget.Latest, true);
  const foreign = new Set(importedNames), errors = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && ['insert', 'update', 'delete'].includes(node.expression.name.text)
      && node.arguments[0] && ts.isIdentifier(node.arguments[0]) && foreign.has(node.arguments[0].text)) {
      errors.push(`Cross-owner ${node.expression.name.text} of ${node.arguments[0].text}; use the owner's application port`);
    }
    if (ts.isTemplateExpression(node)) {
      let prefix = node.head.text;
      for (const span of node.templateSpans) {
        if (/(?:insert\s+into|update|delete\s+from)\s*$/i.test(prefix)
          && ts.isIdentifier(span.expression) && foreign.has(span.expression.text)) errors.push(`Cross-owner SQL write of ${span.expression.text}`);
        prefix = span.literal.text;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return errors;
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
  const observedSchema = new Set();
  for (const file of files) {
    const source = normalize(path.relative(root, file));
    const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const specifiers = [];
    const foreignNames = [];
    function visit(node) {
      if (source.endsWith('/public-api.ts') && ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const target = node.moduleSpecifier.text;
        const names = node.exportClause && ts.isNamedExports(node.exportClause) ? node.exportClause.elements.map(element => element.name.text).sort() : ['*'];
        const error = publicExportError(source, target, names);
        if (error) errors.push(`${source}: ${error}`);
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) {
        const target = normalize(path.relative(root, path.resolve(path.dirname(file), `${node.moduleSpecifier.text}.ts`)));
        const entry = schemaAccess.find(item => item.source === source && item.target === target);
        if (entry) {
          const bindings = node.importClause?.namedBindings;
          const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
          const names = named.map(item => (item.propertyName ?? item.name).text).sort();
          if (node.importClause?.name || JSON.stringify(names) !== JSON.stringify(entry.imports)) errors.push(`${source}: schema access must match the inventoried named imports`);
          observedSchema.add(JSON.stringify(entry));
          foreignNames.push(...named.map(item => item.name.text));
        }
      }
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) specifiers.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node)
        && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
        if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) specifiers.push(node.arguments[0].text);
        else errors.push(`${source}: computed imports cannot be checked`);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    errors.push(...crossOwnerWriteErrors(tree.text, foreignNames).map(error => `${source}: ${error}`));
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
  for (const entry of schemaAccess) {
    if (!observedSchema.has(JSON.stringify(entry))) errors.push(`${entry.source}: remove stale schema access for ${entry.target}`);
  }
  return { files: files.length, errors };
}

module.exports = { boundaryError, publicExportError, checkBoundaries, crossOwnerWriteErrors };
if (require.main === module) {
  const result = checkBoundaries(path.resolve(__dirname, '../src'));
  if (result.errors.length) {
    result.errors.forEach(error => console.error(error));
    process.exitCode = 1;
  } else console.log(`Boundary check passed (${result.files} TypeScript files; no import cycles).`);
}
