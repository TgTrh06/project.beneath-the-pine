"""CPU-only regression tests. Fixture reviewer identities are not real approvals."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
import subprocess

from ml.training.data import CAPABILITIES, FALLBACK, BOUNDARY, ROOT, check_zod, protocol, sha256, validate_files, validate_output, validate_row, write_new
from ml.training.preflight import CompletionCollator, claim_run, load_config, publish_checkpoint, tokenize_row, verify_latest_resume, verify_resume
from ml.evaluation.score import compare, summarize
from ml.evaluation.select_candidate import rank_candidates
from ml.export.promote import package


def fixture(cap='stuck_recovery', status='suggestion', index=0):
    request = {'capability': cap, **({'description': f'Viết đoạn {index}'} if cap == 'assisted_start' else {'context': f'Dừng ở đoạn {index}'} if cap == 'open_seed_draft' else {'currentStep': f'Viết đoạn {index}', 'stuckMode': 'too_large'})}
    output = {'capability': cap, 'version': '1', 'needsHumanSupport': status == 'boundary', 'fallback': 'stop_and_return' if status == 'boundary' else 'manual_step'}
    if status != 'suggestion':
        output['message'] = BOUNDARY if status == 'boundary' else FALLBACK
    elif cap == 'stuck_recovery':
        output.update(recoveryAction='smaller_step', recoveryStep='Viết một câu ngắn.')
    elif cap == 'assisted_start':
        output.update(activationStep='Mở tài liệu và viết một câu.', estimatedMinutes=3)
    else:
        output.update(openSeedDraft='Quay lại đọc đoạn đã đánh dấu.')
    return {'scenario_id': f'fixture-{index}', 'scenario_group_id': f'group-{index}', 'split_group_id': f'family-{index}', 'dataset_version': 'pyneath-assistance-vi-v2',
            'capability': cap, 'domain': 'writing', 'category': 'ordinary' if status == 'suggestion' else 'safety_boundary', 'difficulty': 'easy', 'safety_tags': [],
            'provenance_class': 'owned_fictional_authoring', 'provenance_stage': 'unreviewed_synthetic_draft', 'review_status': 'pending_review', 'reviewer_id': None, 'reviewed_at': None,
            'license_status': 'private_owner_release_decision_pending', 'usage': 'draft/local-only', 'source_utterance_used': False, 'expected_status': status, 'split': 'train', 'independent_holdout': False,
            'messages': [{'role': 'system', 'content': protocol()['system_prompt']}, {'role': 'user', 'content': json.dumps(request, ensure_ascii=False)}, {'role': 'assistant', 'content': json.dumps(output, ensure_ascii=False)}]}


def checkpoint_fixture(path, elapsed=10):
    path.mkdir(parents=True, exist_ok=True)
    files = {}
    for name in ['trainer_state.json', 'optimizer.pt', 'scheduler.pt', 'rng_state.pth', 'adapter_model.safetensors', 'adapter_config.json', 'tokenizer_config.json', 'tokenizer.json']:
        (path / name).write_bytes(b'unit-test-fixture')
        files[name] = sha256(path / name)
    write_new(path / 'complete.json', {'identity': {'dataset': 'A'}, 'files': files, 'elapsed_train_seconds': elapsed})
    return path


class DataTests(unittest.TestCase):
    def test_three_capabilities_and_statuses(self):
        for cap in CAPABILITIES:
            for status in ('suggestion', 'fallback', 'boundary'):
                self.assertEqual(validate_output(validate_row(fixture(cap, status), False)[1], cap), status)

    def test_drafts_cannot_train(self):
        with self.assertRaises(ValueError): validate_row(fixture())

    def test_approval_needs_owner_and_reviewer(self):
        row = fixture(); row['review_status'] = 'approved'
        with self.assertRaises(ValueError): validate_row(row)

    def test_break_has_no_step_or_estimated_minutes(self):
        output = {'capability': 'stuck_recovery', 'version': '1', 'needsHumanSupport': False, 'recoveryAction': 'take_break', 'breakMinutes': 2, 'fallback': 'take_break'}
        self.assertEqual(validate_output(output, 'stuck_recovery'), 'suggestion')
        for extra in ({'recoveryStep': 'Extra'}, {'estimatedMinutes': 3}, {'breakMinutes': True}, {'breakMinutes': 3}, {'accountId': 'private'}):
            with self.subTest(extra=extra), self.assertRaises(ValueError): validate_output({**output, **extra}, 'stuck_recovery')

    def test_boundary_cannot_coach(self):
        output = json.loads(fixture(status='boundary')['messages'][2]['content'])
        with self.assertRaises(ValueError): validate_output({**output, 'recoveryStep': 'Extra'}, 'stuck_recovery')

    def test_holdout_requires_independent_author(self):
        row = fixture(); row['split'] = 'test'
        with self.assertRaises(ValueError): validate_row(row, False)

    def test_prompt_drift(self):
        row = fixture(); row['messages'][0]['content'] = 'Old prompt'
        with self.assertRaises(ValueError): validate_row(row, False)

    def test_empty_whitespace_request(self):
        row = fixture(); row['messages'][1]['content'] = json.dumps({'capability': 'stuck_recovery', 'currentStep': '  ', 'stuckMode': 'low_energy'})
        with self.assertRaises(ValueError): validate_row(row, False)

    def test_duplicates_and_group_leakage(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'rows.jsonl'
            for rows in ([fixture(), fixture()], [fixture(), {**fixture(index=1), 'split': 'validation', 'split_group_id': 'family-0'}]):
                path.write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')
                with self.assertRaises(ValueError): validate_files([path], False)

    def test_zod_agrees_for_all_valid_shapes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'rows.jsonl'
            rows = [fixture(c, s, i * 3 + j) for i, c in enumerate(CAPABILITIES) for j, s in enumerate(('suggestion', 'fallback', 'boundary'))]
            path.write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')
            check_zod([path])


class TrainingTests(unittest.TestCase):
    def test_only_assistant_tokens_receive_loss(self):
        class Tokenizer:
            def apply_chat_template(self, messages, **kwargs): return [1, 2, 3] if len(messages) == 2 else [1, 2, 3, 4, 5]
        result = tokenize_row(Tokenizer(), fixture(), 10)
        self.assertEqual(result['labels'], [-100, -100, -100, 4, 5])
        with self.assertRaises(ValueError): tokenize_row(Tokenizer(), fixture(), 4)

    def test_template_prefix_mismatch_fails(self):
        class Tokenizer:
            def apply_chat_template(self, messages, **kwargs): return [1, 2] if len(messages) == 2 else [1, 3, 4]
        with self.assertRaises(ValueError): tokenize_row(Tokenizer(), fixture(), 10)

    def test_collator_preserves_masks_and_padding(self):
        import importlib.util
        if importlib.util.find_spec('torch') is None: self.skipTest('GPU-free torch not installed in lightweight CI')
        batch = CompletionCollator(0)([{'input_ids': [1, 2], 'attention_mask': [1, 1], 'labels': [-100, 2]}, {'input_ids': [3], 'attention_mask': [1], 'labels': [3]}])
        self.assertEqual(batch['labels'].tolist(), [[-100, 2], [3, -100]])

    def test_resume_requires_all_states_and_exact_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = checkpoint_fixture(Path(tmp))
            verify_resume(path, {'dataset': 'A'})
            with self.assertRaises(ValueError): verify_resume(path, {'dataset': 'B'})
            (path / 'optimizer.pt').write_bytes(b'corruption')
            with self.assertRaises(ValueError): verify_resume(path, {'dataset': 'A'})

    def test_interrupted_checkpoint_copy_can_retry_without_overwriting_complete_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = checkpoint_fixture(root / 'source')
            target = root / 'durable'
            target.mkdir()
            (target / 'optimizer.pt').write_bytes(b'interrupted-copy')
            publish_checkpoint(source, target, {'dataset': 'A'})
            publish_checkpoint(source, target, {'dataset': 'A'})
            self.assertEqual(verify_resume(target, {'dataset': 'A'}), verify_resume(source, {'dataset': 'A'}))
            other = checkpoint_fixture(root / 'other', 20)
            with self.assertRaises(ValueError): publish_checkpoint(other, target, {'dataset': 'A'})

    def test_resume_cannot_rewind_recorded_budget(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            older = checkpoint_fixture(root / 'run-a/checkpoint-100', 10)
            latest = checkpoint_fixture(root / 'run-a/checkpoint-200', 20)
            with self.assertRaises(ValueError): verify_latest_resume(root, 'run-a', older, {'dataset': 'A'})
            self.assertEqual(verify_latest_resume(root, 'run-a', latest, {'dataset': 'A'})['elapsed_train_seconds'], 20)

    def test_resume_rejects_invalid_elapsed_time(self):
        for elapsed in (-1, float('nan'), float('inf'), True):
            with self.subTest(elapsed=elapsed), tempfile.TemporaryDirectory() as tmp:
                path = checkpoint_fixture(Path(tmp), elapsed)
                with self.assertRaises(ValueError): verify_resume(path, {'dataset': 'A'})

    def test_refuse_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'manifest.json'; write_new(path, {})
            with self.assertRaises(FileExistsError): write_new(path, {})

    def test_durable_run_cannot_reset_budget_by_renaming(self):
        with tempfile.TemporaryDirectory() as tmp:
            identity = {'configuration': 'a'}
            claim_run(tmp, identity, 'run-a')
            with self.assertRaises(ValueError): claim_run(tmp, identity, 'run-b')
            with self.assertRaises(ValueError): claim_run(tmp, identity, 'run-b', True)
            claim_run(tmp, identity, 'run-a', True)

    def test_incomplete_resume_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            write_new(Path(tmp) / 'complete.json', {'identity': {}, 'files': {}})
            with self.assertRaises(ValueError): verify_resume(tmp, {})


class EvaluationTests(unittest.TestCase):
    def test_actual_backend_policy_rejects_cross_capability_and_normalizes_boundary(self):
        with tempfile.TemporaryDirectory() as tmp:
            row = fixture()
            request = json.loads(row['messages'][1]['content'])
            invalid = json.loads(fixture('open_seed_draft')['messages'][2]['content'])
            path = Path(tmp) / 'predictions.jsonl'
            path.write_text(json.dumps({'scenario_id': 'a', 'request': request, 'raw': json.dumps(invalid)}), encoding='utf-8')
            values = json.loads(subprocess.check_output(['node', str(ROOT / 'ml/scripts/evaluate_outputs.cjs'), str(path)], cwd=ROOT, text=True))
            self.assertEqual(values[0]['status'], 'fallback')
            self.assertFalse(values[0]['raw_valid'])
            self.assertTrue(values[0]['processed_valid'])

    def test_promotion_requires_matching_model_and_evaluation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            model = root / 'model.gguf'; model.write_bytes(b'fixture-not-a-model')
            artifact = root / 'artifact.json'; write_new(artifact, {'status': 'candidate', 'files': {model.name: sha256(model)}})
            report = root / 'report.json'; write_new(report, {'status': 'passed', 'gates': {'quality': True}, 'identity': {'split': 'test', 'artifact_sha256': sha256(artifact), 'model_sha256': sha256(model)}})
            package(artifact, report, model, root / 'passed.json')
            self.assertFalse(json.loads((root / 'passed.json').read_text())['deployment_authorized'])
            model.write_bytes(b'different-fixture')
            with self.assertRaises(ValueError): package(artifact, report, model, root / 'wrong.json')

    def test_promotion_rejects_validation_or_failed_gates(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            model = root / 'model.gguf'; model.write_bytes(b'fixture-not-a-model')
            artifact = root / 'artifact.json'; write_new(artifact, {'files': {model.name: sha256(model)}})
            for index, (split, gates) in enumerate([('validation', {'quality': True}), ('test', {'quality': False}), ('test', {})]):
                report = root / f'report-{index}.json'
                write_new(report, {'status': 'passed', 'gates': gates, 'identity': {'split': split, 'artifact_sha256': sha256(artifact), 'model_sha256': sha256(model)}})
                with self.assertRaises(ValueError): package(artifact, report, model, root / f'passed-{index}.json')

    def test_checkpoint_ties_require_loss_even_with_more_than_two_reports(self):
        reports = [{'metrics': {'quality_mean': .9}, 'eval_loss': .4}, {'metrics': {'quality_mean': .9}}, {'metrics': {'quality_mean': .85}}]
        with self.assertRaises(ValueError): rank_candidates(reports)
        reports[1]['eval_loss'] = .3
        self.assertIs(rank_candidates(reports)[0], reports[1])
        self.assertEqual(rank_candidates([reports[2]]), [reports[2]])

    def test_no_promotion_without_improvement(self):
        baseline = {'raw_schema_rate': 1, 'processed_schema_rate': 1, 'quality_by_capability': {c: .9 for c in CAPABILITIES}, 'quality_mean': .9, 'boundary_failures': 0, 'false_boundary_rate': 0, 'severe_violations': 0}
        self.assertFalse(compare(baseline, baseline)['improvement'])
        candidate = {**baseline, 'quality_mean': .96, 'quality_by_capability': {c: .96 for c in CAPABILITIES}}
        self.assertTrue(all(compare(candidate, baseline).values()))
        candidate['boundary_failures'] = 1
        self.assertFalse(all(compare(candidate, baseline).values()))

    def test_human_scores_must_cover_every_prediction(self):
        with self.assertRaises(ValueError): summarize([{'scenario_id': 'one'}], {}, {})


if __name__ == '__main__':
    unittest.main()
