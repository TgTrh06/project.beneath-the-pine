"""CPU-only architecture and command adapter checks; no model allocation."""
import importlib
import subprocess
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from ml.common.protocol import ROOT
from ml.scripts.check_boundaries import check, repository_sources


class ArchitectureTests(unittest.TestCase):
    def test_repository_boundaries(self):
        self.assertEqual(check(repository_sources()), [])

    def test_rejects_inward_cross_workflow_and_cli_dependencies(self):
        for source, target in [
            ('ml.common.data', 'ml.training.preflight'),
            ('ml.evaluation.scoring', 'ml.training.preflight'),
            ('ml.export.conversion', 'ml.evaluation.scoring'),
            ('ml.evaluation.scoring', 'ml.evaluation.score'),
            ('ml.training.workflow', 'argparse'),
            ('ml.common.protocol', 'torch'),
        ]:
            with self.subTest(source=source, target=target):
                self.assertTrue(check({source: f'import {target}'}))

    def test_relative_local_and_dynamic_imports_are_checked(self):
        sources = {
            'ml.common.invalid': 'def load():\n from ..training.preflight import tokenize_row',
            'ml.export.invalid': "def load():\n return __import__('ml.training.preflight')",
        }
        self.assertEqual(len(check(sources)), 3)  # Module and imported member are both checked.

    def test_detects_cycles_through_relative_imports(self):
        errors = check({'ml.common.a': 'from . import b', 'ml.common.b': 'from .a import value'})
        self.assertTrue(any('Import cycle' in error for error in errors))

    def test_allows_workflow_to_common_and_cli_to_implementation(self):
        self.assertEqual(check({
            'ml.training.train': 'import argparse\nfrom ml.training.workflow import train',
            'ml.training.workflow': 'from ml.common.checkpoints import verify_resume',
            'ml.common.checkpoints': 'from .files import sha256',
        }), [])

    def test_cli_forwards_unchanged_parsed_options(self):
        cases = [
            ('ml.training.train', 'train', ['--train', 't', '--validation', 'v', '--manifest', 'm', '--output', 'o', '--checkpoint-store', 's', '--smoke', '--resume', 'c']),
            ('ml.evaluation.run', 'collect', ['--dataset', 'd', '--output', 'o', '--candidate-record', 'c']),
            ('ml.evaluation.score', 'score', ['--run', 'r', '--reviews', 'v', '--output', 'o', '--checkpoint', 'c']),
            ('ml.evaluation.benchmark', 'benchmark', ['--api-origin', 'http://127.0.0.1', '--cases', 'c', '--output', 'o', '--hardware-evidence', 'h']),
            ('ml.evaluation.select_candidate', 'select_candidate', ['--reports', 'a', 'b', '--test', 't', '--output', 'o']),
            ('ml.export.gguf', 'export_gguf', ['--run', 'r', '--adapter-report', 'a', '--llama-cpp', 'l', '--llama-revision', 'v', '--quantize-binary', 'q', '--output', 'o', '--quantization', 'Q8_0']),
        ]
        for module_name, operation, arguments in cases:
            with self.subTest(module=module_name):
                module = importlib.import_module(module_name)
                with patch.object(module, operation) as execute, patch.object(sys, 'argv', [module_name, *arguments]):
                    module.main()
                execute.assert_called_once()
                options = vars(execute.call_args.args[0])
                self.assertEqual(options['output'], 'o')
                if 'smoke' in options:
                    self.assertTrue(options['smoke'])
                    self.assertEqual(options['resume'], 'c')
                if 'reports' in options:
                    self.assertEqual(options['reports'], ['a', 'b'])
                if 'quantization' in options:
                    self.assertEqual(options['quantization'], 'Q8_0')

    def test_training_fails_before_environment_or_model_loading(self):
        from ml.training.workflow import train
        with patch('ml.training.workflow.load_config', side_effect=ValueError('invalid config')), patch('ml.training.workflow.environment_versions') as environment:
            with self.assertRaisesRegex(ValueError, 'invalid config'):
                train(SimpleNamespace(config='invalid'))
            environment.assert_not_called()

    def test_documented_script_entry_points_work_outside_repo(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            for script in ('ml/train_colab.py', 'ml/scripts/prepare_v2.py', 'ml/scripts/draft_v2.py',
                           'ml/scripts/generate_pyneath_dataset.py', 'ml/scripts/generate_local_synthetic_dataset.py',
                           'ml/scripts/audit_pyneath_dataset.py', 'ml/scripts/split_dataset.py', 'ml/scripts/validate_dataset.py'):
                result = subprocess.run([sys.executable, str(ROOT / script), '--help'], cwd=directory, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_historical_fixture_commands_compose_and_keep_review_gate(self):
        import json
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'fictional.jsonl'
            output = Path(directory) / 'splits'

            def run(name, *arguments):
                return subprocess.run([sys.executable, str(ROOT / 'ml/scripts' / name), *map(str, arguments)], cwd=directory, capture_output=True, text=True)

            generated = run('generate_local_synthetic_dataset.py', '--output', source)
            self.assertEqual(generated.returncode, 0, generated.stderr)
            checked = run('validate_dataset.py', source)
            self.assertEqual(checked.returncode, 0, checked.stderr)
            self.assertEqual(json.loads(checked.stdout)['rows'], 600)
            rejected = run('validate_dataset.py', source, '--require-reviewed')
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn('cannot be certified training-ready', rejected.stderr)
            split = run('split_dataset.py', source, output)
            self.assertEqual(split.returncode, 0, split.stderr)
            groups = [{json.loads(line)['scenario_id'] for line in (output / f'{name}.jsonl').read_text(encoding='utf-8').splitlines()} for name in ('train', 'validation', 'test')]
            self.assertEqual(sum(map(len, groups)), 600)
            self.assertFalse(groups[0] & groups[1] or groups[0] & groups[2] or groups[1] & groups[2])


if __name__ == '__main__':
    unittest.main()
