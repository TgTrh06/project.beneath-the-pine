"""Check offline Python ownership and import cycles without loading ML runtimes."""
import ast
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AREAS = {'common', 'training', 'evaluation', 'export', 'authoring'}
CLI_MODULES = {
    'ml.train_colab', 'ml.training.train', 'ml.evaluation.run',
    'ml.evaluation.score', 'ml.evaluation.benchmark', 'ml.evaluation.blind_review',
    'ml.evaluation.select_candidate', 'ml.export.gguf', 'ml.export.promote',
    'ml.scripts.prepare_v2', 'ml.scripts.draft_v2',
    'ml.scripts.generate_pyneath_dataset', 'ml.scripts.generate_local_synthetic_dataset',
    'ml.scripts.audit_pyneath_dataset', 'ml.scripts.split_dataset', 'ml.scripts.validate_dataset',
    'ml.scripts.review_dataset',
}
GPU_PACKAGES = {'torch', 'transformers', 'unsloth', 'trl', 'peft', 'datasets', 'bitsandbytes', 'accelerate'}


def imports(source, module):
    """Include function-local imports and literal dynamic imports in the graph."""
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name, node.lineno
        elif isinstance(node, ast.ImportFrom):
            base = node.module or ''
            if node.level:
                base = '.'.join(module.split('.')[:-node.level] + ([base] if base else []))
            yield base, node.lineno
            for alias in node.names:
                yield base + '.' + alias.name, node.lineno
        elif isinstance(node, ast.Call) and node.args and isinstance(node.args[0], ast.Constant):
            name = node.func.id if isinstance(node.func, ast.Name) else node.func.attr if isinstance(node.func, ast.Attribute) else ''
            if name in ('__import__', 'import_module') and isinstance(node.args[0].value, str):
                yield node.args[0].value, node.lineno


def violation(source, target):
    parts = source.split('.')
    area = parts[1] if len(parts) > 1 else ''
    target_parts = target.split('.')
    target_area = target_parts[1] if target.startswith('ml.') and len(target_parts) > 1 else ''
    if area not in AREAS:
        return None  # Legacy CLI tools and tests are adapters, not shared libraries.
    if target in CLI_MODULES:
        return 'implementation must not import a CLI entry point'
    if target_area and target_area not in (area, 'common'):
        return 'cross-workflow dependency; move shared behavior to ml.common'
    if area == 'common' and target.split('.')[0] in GPU_PACKAGES:
        return 'common validation must not depend on a model/GPU runtime'
    if source not in CLI_MODULES and target == 'argparse':
        return 'argument parsing belongs in a CLI entry point'
    return None


def check(sources):
    errors, edges = [], {module: set() for module in sources}
    for module, source in sources.items():
        for target, line in imports(source, module):
            reason = violation(module, target)
            if reason:
                errors.append(f'{module}:{line}: {reason}: {target}')
            if target in sources:
                edges[module].add(target)
    visited, active = set(), []

    def visit(module):
        if module in active:
            errors.append('Import cycle: ' + ' -> '.join(active[active.index(module):] + [module]))
            return
        if module in visited:
            return
        active.append(module)
        for target in sorted(edges[module]):
            visit(target)
        active.pop()
        visited.add(module)

    for module in sorted(sources):
        visit(module)
    return errors


def repository_sources(root=ROOT):
    # Only source directories; never enumerate private datasets, artifacts or environments.
    paths = [root / 'ml/train_colab.py']
    for area in (*sorted(AREAS), 'scripts', 'tests'):
        paths.extend((root / 'ml' / area).glob('*.py'))
    return {'.'.join(path.relative_to(root).with_suffix('').parts): path.read_text(encoding='utf-8') for path in paths}


if __name__ == '__main__':
    sources = repository_sources()
    errors = check(sources)
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Python boundaries passed: {len(sources)} files, no import cycles.')
