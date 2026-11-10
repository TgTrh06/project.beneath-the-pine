"""Fictional review identities below are test fixtures, never dataset approval."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ml.authoring import review_workflow as workflow
from ml.common.data_review import clear_approval, content_hash, decision_form, duplicate_report, validate_decision
from ml.common.config import load_config
from ml.common.files import write_new
from ml.common.protocol import ROOT, CAPABILITIES
from ml.tests.test_local_ai import fixture
from ml.training.preflight import dataset_token_report


def approval(row):
    result = decision_form(row)
    result.update(decision='approve', reviewer_id='test-reviewer-only', reviewed_at='2026-01-01T00:00:00Z',
                  reason='Fictional CPU test decision, not actual approval.', expected_status=row['expected_status'])
    result['checks'] = {key: True for key in result['checks']}
    result['scores'] = {key: 2 if row['expected_status'] == 'suggestion' else None for key in result['scores']}
    result['owner_approval'] = {'owner_id': 'test-owner-only', 'approved_at': '2026-01-01T00:00:00Z',
                                'content_sha256': content_hash(row), 'permission': 'private-training-and-evaluation'}
    return result


class ReviewRulesTests(unittest.TestCase):
    def test_hash_binds_label_source_split_and_prompt_but_not_review_metadata(self):
        row = fixture()
        for key, value in [('category', 'challenge'), ('domain', 'study'), ('split', 'validation'),
                           ('provenance_class', 'synthetic_draft_rewritten')]:
            self.assertNotEqual(content_hash(row), content_hash({**row, key: value}))
        self.assertEqual(content_hash(row), content_hash({**row, 'reviewer_id': 'someone'}))
        edited = copy.deepcopy(row); edited['messages'][0]['content'] += 'changed'
        self.assertNotEqual(content_hash(row), content_hash(edited))

    def test_approval_requires_real_fields_score_owner_and_current_display(self):
        row = fixture(); valid = approval(row)
        validate_decision(row, valid)
        invalid = []
        for key, value in [('reviewer_id', ''), ('reviewed_at', '2026-01-01'), ('reviewed_at', '2999-01-01T00:00:00Z'),
                           ('owner_approval', None), ('content_sha256', 'stale'), ('expected_status', 'boundary')]:
            invalid.append({**copy.deepcopy(valid), key: value})
        bad = copy.deepcopy(valid); bad['scores']['specificity'] = 0; invalid.append(bad)
        bad = copy.deepcopy(valid); bad['scores']['specificity'] = True; invalid.append(bad)
        bad = copy.deepcopy(valid); bad['checks']['policy'] = 1; invalid.append(bad)
        bad = copy.deepcopy(valid); bad['display']['output']['recoveryStep'] = 'Altered display'; invalid.append(bad)
        bad = copy.deepcopy(valid); bad['owner_approval']['content_sha256'] = 'stale'; invalid.append(bad)
        for decision in invalid:
            with self.subTest(decision=decision['reviewed_at']), self.assertRaises(ValueError): validate_decision(row, decision)

    def test_boundary_does_not_use_suggestion_scores(self):
        row = fixture(status='boundary'); decision = approval(row)
        validate_decision(row, decision)
        decision['scores']['specificity'] = 2
        with self.assertRaises(ValueError): validate_decision(row, decision)

    def test_holdout_requires_content_bound_independence_attestation(self):
        row = {**fixture(), 'split': 'test', 'independent_holdout': True}
        decision = approval(row)
        with self.assertRaises(ValueError): validate_decision(row, decision)
        decision['independent_authorship'] = {'author_id': 'test-author-only', 'authored_at': '2026-01-01T00:00:00Z',
            'content_sha256': content_hash(row), 'no_development_rows_seen': True, 'not_model_output': True, 'method': 'Fictional unit test'}
        validate_decision(row, decision)
        decision['independent_authorship']['no_development_rows_seen'] = False
        with self.assertRaises(ValueError): validate_decision(row, decision)

    def test_cross_capability_and_within_split_duplicates_are_visible(self):
        a = fixture(index=1); b = fixture('assisted_start', index=2)
        b['messages'][1]['content'] = json.dumps({'capability': 'assisted_start', 'description': 'VIET DOAN 1'})
        report = duplicate_report([a, b])
        self.assertEqual(report['pairs_count'], 1)
        self.assertEqual(report['pairs'][0]['kind'], 'normalized_exact')
        self.assertFalse(report['pairs'][0]['cross_split'])

    def test_token_report_does_not_truncate_or_expose_content(self):
        class Tokenizer:
            def apply_chat_template(self, messages, **kwargs): return [1, 2] if len(messages) == 2 else [1, 2, 3, 4]
        report = dataset_token_report(Tokenizer(), [fixture()], 3)
        self.assertFalse(report['passed'])
        self.assertEqual(report['violations'][0]['scenario_id'], 'fixture-0')
        self.assertNotIn('messages', json.dumps(report))
        self.assertTrue(dataset_token_report(Tokenizer(), [fixture()], 4)['passed'])


class ReviewWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.row = fixture()
        self.source = self.root / 'source.jsonl'; workflow.write_rows(self.source, [self.row])
        self.workspace = self.root / 'initial'
        workflow.prepare([self.source], self.workspace)

    def form(self, decision=None):
        target = self.root / 'form.json'
        workflow.form(self.workspace, target)
        payload = json.loads(target.read_text(encoding='utf-8'))
        if decision is not None: payload['reviews'][0] = decision
        target.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
        return target

    def test_pending_form_has_no_approval_and_does_not_apply(self):
        path = self.form()
        self.assertTrue(path.with_suffix('.md').exists())
        with self.assertRaises(ValueError): workflow.apply(self.workspace, path, self.root / 'applied')
        self.assertFalse((self.root / 'applied').exists())

    def test_partial_review_and_revision_invalidates_approval_preserves_history(self):
        form = self.form(approval(self.row)); approved = self.root / 'approved'
        workflow.apply(self.workspace, form, approved)
        rows, events, _, manifest = workflow.load(approved)
        self.assertEqual(rows[0]['review_status'], 'approved')
        messages = copy.deepcopy(rows[0]['messages'])
        messages[2]['content'] = json.dumps({**json.loads(messages[2]['content']), 'recoveryStep': 'Đặt tên cho một đoạn ghi chú.'}, ensure_ascii=False)
        edits = self.root / 'edits.json'
        write_new(edits, {'snapshot_id': manifest['snapshot_id'], 'edits': [{
            'scenario_id': self.row['scenario_id'], 'content_sha256': content_hash(rows[0]),
            'changes': {'messages': messages}, 'editor_id': 'test-editor-only', 'edited_at': '2026-01-02T00:00:00Z', 'reason': 'Fixture edit'}]})
        revised = self.root / 'revised'; workflow.revise(approved, edits, revised)
        rows, events, _, _ = workflow.load(revised)
        self.assertEqual(rows[0]['review_status'], 'pending_review'); self.assertIsNone(rows[0]['reviewer_id'])
        self.assertEqual([e['kind'] for e in events], ['review', 'revision'])
        with self.assertRaises(ValueError): workflow.apply(revised, form, self.root / 'stale')
        self.assertEqual(workflow.load(approved)[0][0]['review_status'], 'approved')

    def test_direct_snapshot_mutation_and_overwrite_are_rejected(self):
        with self.assertRaises(ValueError): workflow.prepare([self.source], self.workspace)
        with (self.workspace / 'rows.jsonl').open('a') as stream: stream.write('\n')
        with self.assertRaises(ValueError): workflow.load(self.workspace)

    def test_duplicate_decision_or_modified_display_cannot_partially_commit(self):
        path = self.form(approval(self.row))
        payload = json.loads(path.read_text(encoding='utf-8')); payload['reviews'] *= 2
        path.write_text(json.dumps(payload), encoding='utf-8')
        with self.assertRaises(ValueError): workflow.apply(self.workspace, path, self.root / 'bad')
        self.assertFalse((self.root / 'bad').exists())
        self.assertEqual(workflow.load(self.workspace)[0][0]['review_status'], 'pending_review')

    def test_revise_reject_escalate_do_not_grant_training_permission(self):
        for decision in ('revise', 'reject', 'escalate'):
            value = approval(self.row); value['decision'] = decision
            payload = {'snapshot_id': workflow.load(self.workspace)[3]['snapshot_id'], 'rubric_version': 'pyneath-data-review-v1', 'reviews': [value]}
            path = self.root / f'{decision}.json'; write_new(path, payload)
            destination = self.root / decision; workflow.apply(self.workspace, path, destination)
            row = workflow.load(destination)[0][0]
            self.assertNotEqual(row['review_status'], 'approved'); self.assertEqual(row['usage'], 'draft/local-only')

    def test_reused_synthetic_draft_requires_recorded_rewrite(self):
        row = {**fixture(index=2), 'provenance_class': 'synthetic_draft_rewritten'}
        source = self.root / 'synthetic.jsonl'; workflow.write_rows(source, [row])
        workspace = self.root / 'synthetic'; workflow.prepare([source], workspace)
        decision = self.root / 'synthetic-form.json'; workflow.form(workspace, decision)
        payload = json.loads(decision.read_text(encoding='utf-8')); payload['reviews'][0] = approval(row)
        decision.write_text(json.dumps(payload), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'rewrite'): workflow.apply(workspace, decision, self.root / 'unearned')

    def test_calibration_fails_on_missing_recovery_boundary(self):
        with self.assertRaisesRegex(ValueError, 'coverage missing'): workflow.form(self.workspace, self.root / 'pilot.json', calibration=True)
        self.assertFalse((self.root / 'pilot.json').exists())

    def test_audit_exposes_group_leakage_and_missing_coverage(self):
        other = fixture(index=1); other.update(split='validation', split_group_id=self.row['split_group_id'])
        source = self.root / 'leak.jsonl'; workflow.write_rows(source, [other])
        workspace = self.root / 'leak'; workflow.prepare([self.source, source], workspace)
        report = self.root / 'audit.json'; result = workflow.audit(workspace, report)
        self.assertFalse(result['structural_passed']); self.assertGreater(result['coverage_gaps'], 0)

    def test_selection_preserves_evidence_and_rejects_overlapping_snapshots(self):
        with self.assertRaises(ValueError): workflow.combine([self.workspace, self.workspace], self.root / 'overlap')
        selected = self.root / 'ids.json'; write_new(selected, [self.row['scenario_id']])
        workflow.combine([self.workspace], self.root / 'selected', selected)
        self.assertEqual(workflow.load(self.root / 'selected')[0][0], clear_approval(self.row))

    def test_selected_snapshot_keeps_only_selected_row_events(self):
        form = self.form(approval(self.row)); approved = self.root / 'approved'; workflow.apply(self.workspace, form, approved)
        other = fixture(index=1); source = self.root / 'other.jsonl'; workflow.write_rows(source, [other])
        other_workspace = self.root / 'other'; workflow.prepare([source], other_workspace)
        combined = self.root / 'combined'; workflow.combine([approved, other_workspace], combined)
        selected = self.root / 'ids.json'; write_new(selected, [other['scenario_id']])
        workflow.combine([combined], self.root / 'selected', selected)
        self.assertEqual(workflow.load(self.root / 'selected')[1], [])
        workflow.combine([approved, self.root / 'selected'], self.root / 'recombined')
        self.assertEqual(len(workflow.load(self.root / 'recombined')[1]), 1)

    def test_partial_calibration_can_resume_only_its_remaining_ids(self):
        other = fixture(index=1); source = self.root / 'other.jsonl'; workflow.write_rows(source, [other])
        workspace = self.root / 'two'; workflow.prepare([self.source, source], workspace)
        form = self.root / 'partial.json'; workflow.form(workspace, form)
        payload = json.loads(form.read_text(encoding='utf-8')); payload['reviews'][0] = approval(self.row)
        form.write_text(json.dumps(payload), encoding='utf-8')
        next_round = self.root / 'partial'; workflow.apply(workspace, form, next_round)
        ids = self.root / 'pilot-ids.json'; write_new(ids, [self.row['scenario_id'], other['scenario_id']])
        resumed = self.root / 'resumed.json'; workflow.form(next_round, resumed, selection=ids)
        self.assertEqual([r['scenario_id'] for r in json.loads(resumed.read_text(encoding='utf-8'))['reviews']], [other['scenario_id']])

    def test_export_rejects_unreviewed_and_incomplete_data_before_writing(self):
        with self.assertRaisesRegex(ValueError, 'human-approved'):
            workflow.export(self.workspace, self.root / 'absent', self.root / 'absent', self.root / 'export')
        form = self.form(approval(self.row)); approved = self.root / 'approved'; workflow.apply(self.workspace, form, approved)
        with self.assertRaisesRegex(ValueError, 'coverage'):
            workflow.export(approved, self.root / 'absent', self.root / 'absent', self.root / 'export')
        self.assertFalse((self.root / 'export').exists())

    def test_cli_is_available_outside_repo_and_fails_closed(self):
        script = ROOT / 'ml/scripts/review_dataset.py'
        result = subprocess.run([sys.executable, str(script), '--help'], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        result = subprocess.run([sys.executable, str(script), 'apply', '--workspace', str(self.workspace),
                                 '--form', str(self.form()), '--output', str(self.root / 'bad')], cwd=self.root, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0); self.assertIn('No actual human decisions', result.stderr)


class HandoffTests(unittest.TestCase):
    def test_full_review_handoff_requires_hash_bound_semantic_and_token_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); rows = []; history = []
            for cap in CAPABILITIES:
                for scope, targets in [('development', (350, 75, 75)), ('test', (70, 15, 15))]:
                    for category, count in zip(('ordinary', 'safety_boundary', 'challenge'), targets):
                        for i in range(count):
                            row = fixture(cap, 'boundary' if category == 'safety_boundary' else 'suggestion', len(rows))
                            row.update(category=category, split='test' if scope == 'test' else 'validation' if i % 5 == 0 else 'train',
                                       independent_holdout=scope == 'test')
                            if cap == 'stuck_recovery':
                                request = json.loads(row['messages'][1]['content'])
                                request['stuckMode'] = ('too_large', 'unclear_next_step', 'distracted', 'low_energy')[i % 4]
                                row['messages'][1]['content'] = json.dumps(request, ensure_ascii=False)
                                if row['expected_status'] == 'suggestion':
                                    output = json.loads(row['messages'][2]['content'])
                                    output['recoveryAction'] = ('smaller_step', 'different_approach', 'take_break')[i % 3]
                                    if output['recoveryAction'] == 'take_break':
                                        output.pop('recoveryStep'); output.update(fallback='take_break', breakMinutes=2)
                                    row['messages'][2]['content'] = json.dumps(output, ensure_ascii=False)
                            decision = approval(row)
                            if scope == 'test':
                                decision['independent_authorship'] = {'author_id': 'test-author-only', 'authored_at': '2026-01-01T00:00:00Z',
                                    'content_sha256': content_hash(row), 'no_development_rows_seen': True, 'not_model_output': True, 'method': 'Fictional unit test'}
                            row.update(review_status='approved', reviewer_id=decision['reviewer_id'], reviewed_at=decision['reviewed_at'],
                                       license_status='owner_approved', provenance_stage='reviewed', usage='training-approved')
                            rows.append(row); history.append({'kind': 'review', 'scenario_id': row['scenario_id'], 'decision': decision})
            workspace = root / 'reviewed'; workflow.save(workspace, rows, history, [], [])
            manifest = workflow.load(workspace)[3]
            evidence = {'snapshot_id': manifest['snapshot_id'], 'reviewer_id': 'test-reviewer-only',
                        'reviewed_at': '2026-01-01T00:00:00Z', 'semantic_overlap_review': 'approved', 'duplicate_decisions': []}
            evidence_path = root / 'evidence.json'; write_new(evidence_path, evidence)
            config = load_config(ROOT / 'ml/configs/qlora-v2.yaml')
            tokens = {'snapshot_id': manifest['snapshot_id'], 'rows_sha256': manifest['files']['rows.jsonl'],
                      'base_model': config['base_model'], 'base_revision': config['base_revision'], 'limit': 1024,
                      'max_tokens': 500, 'rows': 1800, 'passed': True, 'violations': []}
            token_path = root / 'tokens.json'; write_new(token_path, tokens)
            # Actual Zod validation is covered separately; no dependency build required for this unit fixture.
            with patch.object(workflow, 'check_zod') as zod:
                result = workflow.export(workspace, evidence_path, token_path, root / 'handoff')
                zod.assert_called_once()
                self.assertEqual(result['status'], 'reviewed-awaiting-freeze')
                self.assertEqual(len((root / 'handoff/test.jsonl').read_text(encoding='utf-8').splitlines()), 300)
                self.assertFalse((root / 'handoff/manifest.json').exists())
            tokens['snapshot_id'] = 'stale'; token_path.write_text(json.dumps(tokens), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'tokenizer report'):
                workflow.export(workspace, evidence_path, token_path, root / 'bad-token')
            evidence['semantic_overlap_review'] = None; evidence_path.write_text(json.dumps(evidence), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Semantic overlap'):
                workflow.export(workspace, evidence_path, token_path, root / 'bad-human')


if __name__ == '__main__': unittest.main()
