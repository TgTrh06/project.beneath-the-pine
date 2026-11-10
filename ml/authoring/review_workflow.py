"""Immutable local dataset review snapshots, forms, revisions and handoff packages."""
import copy
import json
import random
from pathlib import Path

from ml.common.data_review import (CATEGORIES, RUBRIC_VERSION, clear_approval, content_hash, coverage,
                                   decision_form, digest, duplicate_report, identity, timestamp, validate_decision)
from ml.common.datasets import check_zod, validate_files, validate_row
from ml.common.config import load_config
from ml.common.files import read_rows, sha256, write_new
from ml.common.protocol import CAPABILITIES, PROTOCOL_PATH, protocol


def write_rows(path, rows):
    with Path(path).open('x', encoding='utf-8', newline='\n') as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n')


def save(destination, rows, history, sources, parents):
    destination = Path(destination)
    if destination.exists():
        raise ValueError('Refusing to overwrite review snapshot')
    if not rows or len({r['scenario_id'] for r in rows}) != len(rows):
        raise ValueError('Empty dataset or duplicate scenario IDs')
    for row in rows:
        validate_row(row, reviewed=False)
    destination.mkdir(parents=True)
    write_rows(destination / 'rows.jsonl', rows)
    write_new(destination / 'history.json', history)
    write_new(destination / 'sources.json', sources)
    manifest = {'format': 'pyneath-review-snapshot-v1', 'rubric_version': RUBRIC_VERSION,
                'protocol_sha256': sha256(PROTOCOL_PATH), 'parents': parents,
                'files': {name: sha256(destination / name) for name in ('rows.jsonl', 'history.json', 'sources.json')}}
    manifest['snapshot_id'] = digest(manifest)
    write_new(destination / 'snapshot.json', manifest)  # Completion marker written last.
    return {'snapshot_id': manifest['snapshot_id'], 'rows': len(rows), 'approved': sum(r['review_status'] == 'approved' for r in rows)}


def load(directory):
    directory = Path(directory)
    manifest = json.loads((directory / 'snapshot.json').read_text(encoding='utf-8'))
    if (manifest['format'] != 'pyneath-review-snapshot-v1' or manifest['rubric_version'] != RUBRIC_VERSION
            or manifest['protocol_sha256'] != sha256(PROTOCOL_PATH)
            or manifest['snapshot_id'] != digest({k: v for k, v in manifest.items() if k != 'snapshot_id'})
            or set(manifest['files']) != {'rows.jsonl', 'history.json', 'sources.json'}):
        raise ValueError('Invalid review snapshot identity')
    for name, checksum in manifest['files'].items():
        if sha256(directory / name) != checksum:
            raise ValueError('Snapshot was edited directly; use revise with a new destination')
    rows = list(read_rows(directory / 'rows.jsonl'))
    history = json.loads((directory / 'history.json').read_text(encoding='utf-8'))
    sources = json.loads((directory / 'sources.json').read_text(encoding='utf-8'))
    if not rows or len({r['scenario_id'] for r in rows}) != len(rows):
        raise ValueError('Empty or duplicate scenario IDs')
    latest = {}
    for event in history:
        latest[event['scenario_id']] = event
    for row in rows:
        validate_row(row, reviewed=False)
        event = latest.get(row['scenario_id'])
        if row['review_status'] == 'approved':
            if not event or event['kind'] != 'review' or event['decision']['decision'] != 'approve':
                raise ValueError('Approval has no corresponding human review event')
            validate_decision(row, event['decision'])
            require_rewrite(row, history)
            if any(row[key] != event['decision'][key] for key in ('reviewer_id', 'reviewed_at')):
                raise ValueError('Reviewer metadata differs from review event')
    return rows, history, sources, manifest


def require_rewrite(row, history):
    if row['provenance_class'] == 'synthetic_draft_rewritten' and not any(
            event['kind'] == 'revision' and event['scenario_id'] == row['scenario_id']
            and event.get('messages_changed') is True for event in history):
        raise ValueError('Reused synthetic draft needs a recorded content rewrite before approval')


def prepare(paths, destination):
    rows, sources = [], []
    for path in paths:
        path = Path(path)
        checksum = sha256(path)
        incoming = list(read_rows(path))
        for row in incoming:
            validate_row(row, reviewed=False)
            rows.append(clear_approval(row))
        if sha256(path) != checksum:
            raise ValueError('Input changed while preparing review')
        sources.append({'file': str(path.resolve()), 'sha256': checksum,
                        'scenario_ids': [r['scenario_id'] for r in incoming],
                        'rights_status': 'requires actual owner permission per reviewed content'})
    return save(destination, rows, [], sources, [])


def form(workspace, destination, calibration=False, limit=None, reviewer_id=None, selection=None):
    rows, _, _, manifest = load(workspace)
    if calibration and limit is not None: raise ValueError('Calibration always has 90 rows; omit limit')
    if selection:
        if calibration: raise ValueError('Use selection to resume an existing calibration, not to choose a new one')
        ids = json.loads(Path(selection).read_text(encoding='utf-8'))
        if not isinstance(ids, list) or len(ids) != len(set(ids)) or not set(ids) <= {r['scenario_id'] for r in rows}:
            raise ValueError('Invalid review selection IDs')
        rows = [row for row in rows if row['scenario_id'] in ids]
    selected = [row for row in rows if row['review_status'] == 'pending_review' and row['split'] != 'test']
    if calibration:
        chosen = []
        for cap in CAPABILITIES:
            for category, count in zip(CATEGORIES, (20, 5, 5)):
                candidates = [row for row in selected if row['capability'] == cap and row['category'] == category]
                random.Random(20261029).shuffle(candidates)
                # Prefer different groups first; additional variants only if needed.
                seen, unique, rest = set(), [], []
                for row in candidates:
                    if row['split_group_id'] in seen: rest.append(row)
                    else: unique.append(row); seen.add(row['split_group_id'])
                if len(candidates) < count:
                    raise ValueError(f'Calibration coverage missing: {cap}:{category}')
                chosen.extend((unique + rest)[:count])
        selected = chosen
    else:
        selected = [row for row in rows if row['review_status'] == 'pending_review']
        if limit is not None:
            if limit < 1: raise ValueError('Limit must be positive')
            by_cap = {cap: [r for r in selected if r['capability'] == cap] for cap in CAPABILITIES}
            selected = []
            while len(selected) < limit and any(by_cap.values()):
                for cap in CAPABILITIES:
                    if by_cap[cap] and len(selected) < limit: selected.append(by_cap[cap].pop(0))
    if not selected: raise ValueError('No pending rows')
    reviews = [decision_form(row) for row in selected]
    if reviewer_id is not None:
        identity(reviewer_id, 'reviewer_id')
        for review in reviews: review['reviewer_id'] = reviewer_id
    destination = Path(destination)
    readable = destination.with_suffix('.md')
    if destination == readable or destination.exists() or readable.exists(): raise ValueError('Review form/readable companion already exists or invalid suffix')
    write_new(destination, {'rubric_version': RUBRIC_VERSION, 'snapshot_id': manifest['snapshot_id'],
                            'status': 'pending-human-review', 'reviews': reviews})
    text = ['# Phiếu đọc review dữ liệu Pyneath', '',
            'Mọi nội dung dưới đây là ứng viên giả lập chưa duyệt. Ghi quyết định trong file JSON cùng tên.',
            'Không sửa nội dung mẫu trong phiếu; dùng lệnh revise để tạo snapshot và phiếu mới.', '',
            f'Snapshot: `{manifest["snapshot_id"]}`', '']
    for index, item in enumerate(reviews, 1):
        body = json.dumps(item['display'], ensure_ascii=False, indent=2)
        fence = '~' * max(4, max((len(part) for part in body.split() if set(part) == {'~'}), default=0) + 1)
        text.extend([f'## {index}. {item["scenario_id"]}', '', f'Hash: `{item["content_sha256"]}`', '', fence + 'json', body, fence, ''])
    with readable.open('x', encoding='utf-8', newline='\n') as stream: stream.write('\n'.join(text))
    return {'rows': len(reviews), 'status': 'pending-human-review'}


def apply(workspace, form_path, destination):
    rows, history, sources, manifest = load(workspace)
    payload = json.loads(Path(form_path).read_text(encoding='utf-8'))
    if payload['snapshot_id'] != manifest['snapshot_id'] or payload['rubric_version'] != RUBRIC_VERSION:
        raise ValueError('Form belongs to another snapshot/rubric')
    by_id = {row['scenario_id']: row for row in rows}; seen = set(); applied = 0
    for decision in payload['reviews']:
        key = decision['scenario_id']
        if key not in by_id or key in seen: raise ValueError('Unknown or duplicate review ID')
        seen.add(key)
        row = by_id[key]
        if row['review_status'] != 'pending_review': raise ValueError('Row already decided; revise to reopen')
        if decision['decision'] is None:
            expected = decision_form(row)
            if any(decision.get(k) != expected[k] for k in ('content_sha256', 'display')):
                raise ValueError('Pending form content changed')
            continue
        validate_decision(row, decision)
        if decision['decision'] == 'approve': require_rewrite(row, history)
        applied += 1
        row.update(clear_approval(row))
        if decision['decision'] == 'approve':
            row.update(review_status='approved', reviewer_id=decision['reviewer_id'], reviewed_at=decision['reviewed_at'],
                       license_status='owner_approved', usage='training-approved', provenance_stage='reviewed')
        elif decision['decision'] == 'reject':
            row['review_status'] = 'rejected'
        history.append({'kind': 'review', 'scenario_id': key, 'decision': copy.deepcopy(decision)})
    if not applied: raise ValueError('No actual human decisions supplied')
    return save(destination, rows, history, sources, [manifest['snapshot_id']])


def revise(workspace, edits_path, destination):
    rows, history, sources, manifest = load(workspace)
    edits = json.loads(Path(edits_path).read_text(encoding='utf-8'))
    if edits['snapshot_id'] != manifest['snapshot_id']: raise ValueError('Stale revision snapshot')
    by_id = {row['scenario_id']: row for row in rows}; seen = set()
    for edit in edits['edits']:
        key = edit['scenario_id']
        if key not in by_id or key in seen: raise ValueError('Unknown or duplicate revision ID')
        seen.add(key); row = by_id[key]
        if edit['content_sha256'] != content_hash(row): raise ValueError('Stale revision content')
        if not edit['changes'] or any(k in REVIEW_FIELDS_FORBIDDEN or k not in row for k in edit['changes']):
            raise ValueError('Cannot revise identity/review fields or introduce metadata')
        identity(edit['editor_id'], 'editor_id'); identity(edit['reason'], 'revision reason'); timestamp(edit['edited_at'])
        if all(row[key] == value for key, value in edit['changes'].items()): raise ValueError('Revision changes no content')
        messages_changed = 'messages' in edit['changes'] and row['messages'] != edit['changes']['messages']
        before = content_hash(row)
        row.update(edit['changes']); row.update(clear_approval(row)); validate_row(row, reviewed=False)
        history.append({'kind': 'revision', 'scenario_id': key, 'before_sha256': before, 'after_sha256': content_hash(row),
                        'editor_id': edit['editor_id'], 'edited_at': edit['edited_at'], 'reason': edit['reason'],
                        'messages_changed': messages_changed,
                        'changes': copy.deepcopy(edit['changes'])})
    if not seen: raise ValueError('No revisions supplied')
    return save(destination, rows, history, sources, [manifest['snapshot_id']])


REVIEW_FIELDS_FORBIDDEN = {'scenario_id', 'dataset_version', 'review_status', 'reviewer_id', 'reviewed_at',
                          'license_status', 'usage', 'provenance_stage'}


def combine(workspaces, destination, selection=None):
    """Combine reviewed snapshots or select final rows without discarding their evidence."""
    rows, history, sources, parents = [], [], [], []
    for workspace in workspaces:
        current, events, origins, manifest = load(workspace)
        current_ids = {row['scenario_id'] for row in current}
        rows.extend(current); history.extend(event for event in events if event['scenario_id'] in current_ids)
        sources.extend(origins); parents.append(manifest['snapshot_id'])
    if len({r['scenario_id'] for r in rows}) != len(rows): raise ValueError('Overlapping snapshots cannot be combined')
    if selection:
        ids = json.loads(Path(selection).read_text(encoding='utf-8'))
        if not isinstance(ids, list) or len(ids) != len(set(ids)) or not set(ids) <= {r['scenario_id'] for r in rows}:
            raise ValueError('Invalid selection IDs')
        rows = [r for r in rows if r['scenario_id'] in ids]
        history = [event for event in history if event['scenario_id'] in ids]
    return save(destination, rows, history, sources, parents)


def audit(workspace, destination):
    rows, history, _, manifest = load(workspace)
    # Retain a useful gap report even when duplicates/group leakage block acceptance.
    try:
        validate_files([Path(workspace) / 'rows.jsonl'], reviewed=False)
        structural = {'passed': True}
    except ValueError as error:
        structural = {'passed': False, 'error': str(error)}
    duplicates = duplicate_report(rows)
    report = {'snapshot_id': manifest['snapshot_id'], 'coverage': coverage(rows), 'structural': structural,
              'duplicates': duplicates, 'review_events': len(history), 'tokenizer_checked': False,
              'status': 'requires-human-review-and-final-validation',
              'human_evidence_template': {'snapshot_id': manifest['snapshot_id'], 'reviewer_id': None, 'reviewed_at': None,
                  'semantic_overlap_review': None, 'duplicate_decisions': [
                      {'pair_id': pair['pair_id'], 'decision': None, 'reason': ''} for pair in duplicates['pairs']]}}
    write_new(destination, report)
    return {'rows': len(rows), 'approved': report['coverage']['review_status'].get('approved', 0),
            'coverage_gaps': len(report['coverage']['coverage_gaps']), 'duplicate_pairs': duplicates['pairs_count'],
            'structural_passed': structural['passed'], 'tokenizer_checked': False}


def export(workspace, evidence_path, token_report_path, destination):
    """Handoff only. Does not create a frozen training manifest or authorize training."""
    rows, history, sources, manifest = load(workspace)
    if any(row['review_status'] != 'approved' for row in rows): raise ValueError('Every selected row must be human-approved')
    report = coverage(rows)
    if report['coverage_gaps'] or report['recovery_gaps']: raise ValueError('Development/holdout coverage is incomplete')
    validate_files([Path(workspace) / 'rows.jsonl'])
    for cap in CAPABILITIES:
        if sum(r['capability'] == cap and r['split'] == 'train' for r in rows) < 350 or sum(r['capability'] == cap and r['split'] == 'validation' for r in rows) < 75:
            raise ValueError('Insufficient per-capability train/validation coverage')
    duplicates = duplicate_report(rows)
    evidence = json.loads(Path(evidence_path).read_text(encoding='utf-8'))
    if any(pair['cross_split'] and pair['kind'] == 'normalized_exact' for pair in duplicates['pairs']):
        raise ValueError('Normalized exact input crosses splits, including cross-capability reuse')
    if evidence['snapshot_id'] != manifest['snapshot_id']: raise ValueError('Stale dataset review evidence')
    identity(evidence['reviewer_id'], 'reviewer_id'); timestamp(evidence['reviewed_at'])
    if evidence.get('semantic_overlap_review') != 'approved': raise ValueError('Semantic overlap review required')
    decisions = evidence['duplicate_decisions']
    if len(decisions) != len({d['pair_id'] for d in decisions}) or {d['pair_id'] for d in decisions} != {p['pair_id'] for p in duplicates['pairs']}:
        raise ValueError('Every current duplicate pair needs a decision')
    for decision in decisions:
        if decision['decision'] != 'distinct_scenarios_or_same_split_family': raise ValueError('Unresolved duplicate pair')
        identity(decision['reason'], 'duplicate decision reason')
    tokens = json.loads(Path(token_report_path).read_text(encoding='utf-8'))
    config = load_config(PROTOCOL_PATH.parent / 'qlora-v2.yaml')
    if (tokens.get('snapshot_id') != manifest['snapshot_id'] or tokens.get('rows_sha256') != manifest['files']['rows.jsonl']
            or tokens.get('rows') != len(rows) or tokens.get('passed') is not True
            or tokens.get('base_model') != config['base_model'] or tokens.get('base_revision') != config['base_revision']
            or tokens.get('limit') != config['max_seq_length'] or tokens.get('violations') != []
            or type(tokens.get('max_tokens')) is not int or not 0 < tokens['max_tokens'] <= config['max_seq_length']):
        raise ValueError('Matching successful pinned-tokenizer report required')
    # Mandatory Zod validation precedes creation of the handoff directory.
    check_zod([Path(workspace) / 'rows.jsonl'])
    destination = Path(destination)
    if destination.exists(): raise ValueError('Refusing to overwrite handoff')
    destination.mkdir(parents=True)
    for split in ('train', 'validation', 'test'):
        write_rows(destination / f'{split}.jsonl', [row for row in rows if row['split'] == split])
    write_new(destination / 'history.json', history)
    write_new(destination / 'sources.json', sources)
    write_new(destination / 'review-evidence.json', evidence)
    write_new(destination / 'token-report.json', tokens)
    write_new(destination / 'handoff.json', {'status': 'reviewed-awaiting-freeze',
              'snapshot_id': manifest['snapshot_id'], 'protocol_revision': protocol()['revision'], 'coverage': report,
              'files': {name: sha256(destination / name) for name in ('train.jsonl', 'validation.jsonl', 'test.jsonl', 'history.json', 'sources.json', 'review-evidence.json', 'token-report.json')}})
    return {'status': 'reviewed-awaiting-freeze', 'rows': len(rows)}
