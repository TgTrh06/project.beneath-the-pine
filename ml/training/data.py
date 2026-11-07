"""V2 validation, review gates and frozen manifests; never prints private text."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import unicodedata
from collections import Counter
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROTOCOL_PATH = ROOT / 'ml/configs/assistance-protocol-v2.json'
CAPABILITIES = ('assisted_start', 'open_seed_draft', 'stuck_recovery')
BOUNDARY = 'Pine không thể gợi ý công việc cho tình huống này. Hãy tìm sự hỗ trợ từ một người bạn tin cậy hoặc dịch vụ chuyên môn phù hợp.'
FALLBACK = 'Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; bạn có thể tự viết bước tiếp theo.'


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def write_new(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


@lru_cache(maxsize=1)
def protocol():
    return json.loads(PROTOCOL_PATH.read_text(encoding='utf-8'))


def normalize(text):
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ', 'd')) if unicodedata.category(c) != 'Mn')).strip()


def validate_output(output, capability):
    from jsonschema import Draft202012Validator
    errors = list(Draft202012Validator(protocol()['output_schema']).iter_errors(output))
    if errors or output.get('capability') != capability:
        raise ValueError('Invalid output schema/capability')
    base = {'capability', 'version', 'needsHumanSupport', 'fallback'}
    if output['needsHumanSupport'] or 'message' in output:
        if set(output) != base | {'message'} or not output['message'].strip():
            raise ValueError('Boundary/fallback must not coach')
        return 'boundary' if output['needsHumanSupport'] else 'fallback'
    if capability == 'assisted_start':
        fields = {'activationStep', 'estimatedMinutes'}
    elif capability == 'open_seed_draft':
        fields = {'openSeedDraft'}
    elif output.get('recoveryAction') == 'take_break':
        fields = {'recoveryAction', 'breakMinutes'}
        if output['fallback'] != 'take_break':
            raise ValueError('Invalid break fallback')
    else:
        fields = {'recoveryAction', 'recoveryStep'}
        if output.get('recoveryAction') not in ('smaller_step', 'different_approach') or output['fallback'] != 'manual_step':
            raise ValueError('Invalid recovery action')
    if set(output) != base | fields:
        raise ValueError('Unexpected suggestion fields')
    for key in ('activationStep', 'openSeedDraft', 'recoveryStep'):
        if key in output and not output[key].strip():
            raise ValueError('Empty suggestion')
    return 'suggestion'


def validate_row(row, reviewed=True):
    from jsonschema import Draft202012Validator
    required = {'scenario_id', 'scenario_group_id', 'split_group_id', 'dataset_version', 'capability', 'domain', 'category', 'difficulty', 'safety_tags', 'provenance_class', 'provenance_stage', 'review_status', 'reviewer_id', 'reviewed_at', 'license_status', 'usage', 'source_utterance_used', 'expected_status', 'split', 'messages', 'independent_holdout'}
    if not required <= row.keys() or row['dataset_version'] != 'pyneath-assistance-vi-v2':
        raise ValueError('Invalid v2 metadata')
    if row['capability'] not in CAPABILITIES or row['split'] not in ('train', 'validation', 'test'):
        raise ValueError('Invalid capability/split')
    if row['category'] not in ('ordinary', 'challenge', 'safety_boundary', 'assisted_start', 'open_seed_draft') or row['difficulty'] not in ('easy', 'moderate', 'hard'):
        raise ValueError('Invalid category/difficulty')
    if not isinstance(row['safety_tags'], list) or not all(isinstance(tag, str) and tag.strip() for tag in row['safety_tags']):
        raise ValueError('Invalid safety tags')
    if any(not isinstance(row[key], str) or not row[key].strip() for key in ('scenario_id', 'scenario_group_id', 'split_group_id', 'domain')):
        raise ValueError('Missing scenario/group identity')
    if row['provenance_class'] not in ('owned_fictional_authoring', 'consented_contributor', 'synthetic_draft_rewritten') or row['source_utterance_used'] is not False:
        raise ValueError('Invalid provenance')
    if row['review_status'] not in ('pending_review', 'approved', 'rejected'):
        raise ValueError('Invalid review status')
    if reviewed or row['review_status'] == 'approved':
        if row['review_status'] != 'approved' or row['provenance_stage'] != 'reviewed' or row['license_status'] != 'owner_approved' or row['usage'] != 'training-approved':
            raise ValueError('Human review and owner approval required')
        if not isinstance(row['reviewer_id'], str) or not row['reviewer_id'].strip() or not isinstance(row['reviewed_at'], str) or not row['reviewed_at'].strip():
            raise ValueError('Missing reviewer evidence')
    elif row['usage'] != 'draft/local-only' or row['reviewer_id'] is not None or row['reviewed_at'] is not None:
        raise ValueError('Draft must not claim sign-off')
    if row['split'] == 'test' and (row['independent_holdout'] is not True or row['provenance_class'] != 'owned_fictional_authoring'):
        raise ValueError('Final holdout must be independently authored')
    if type(row['independent_holdout']) is not bool:
        raise ValueError('Invalid holdout flag')
    messages = row['messages']
    if not isinstance(messages, list) or len(messages) != 3 or [m.get('role') for m in messages] != ['system', 'user', 'assistant'] or any(set(m) != {'role', 'content'} for m in messages):
        raise ValueError('Expected system/user/assistant messages')
    if messages[0]['content'] != protocol()['system_prompt']:
        raise ValueError('Prompt revision mismatch')
    request, output = (json.loads(messages[i]['content']) for i in (1, 2))
    if list(Draft202012Validator(protocol()['request_schema']).iter_errors(request)) or request['capability'] != row['capability']:
        raise ValueError('Invalid request')
    text = request.get('description', request.get('context', request.get('currentStep')))
    if not text.strip():
        raise ValueError('Empty request')
    status = validate_output(output, row['capability'])
    if status != row['expected_status']:
        raise ValueError('Status mismatch')
    if status != 'suggestion':
        if output['message'] != (BOUNDARY if status == 'boundary' else FALLBACK) or output['fallback'] != ('stop_and_return' if status == 'boundary' else 'manual_step'):
            raise ValueError('Noncanonical fallback/boundary')
    return request, output


def read_rows(path):
    with Path(path).open(encoding='utf-8-sig') as stream:
        for line in stream:
            if line.strip():
                yield json.loads(line)


def validate_files(paths, reviewed=True):
    ids, signatures, groups = set(), set(), {}
    counts = Counter()
    near = []
    tokens = []
    for path in paths:
        for row in read_rows(path):
            try:
                request, _ = validate_row(row, reviewed)
                signature = (row['capability'], normalize(json.dumps(request, ensure_ascii=False, sort_keys=True)))
                if row['scenario_id'] in ids or signature in signatures:
                    raise ValueError('Duplicate scenario or normalized input')
                ids.add(row['scenario_id']); signatures.add(signature)
                for field in ('scenario_group_id', 'split_group_id'):
                    key = (field, row[field])
                    if groups.setdefault(key, row['split']) != row['split']:
                        raise ValueError('Group leakage across splits')
                words = set(signature[1].split())
                for other_id, other_split, other_words in tokens:
                    if other_split != row['split'] and len(words & other_words) / max(1, len(words | other_words)) >= .85:
                        near.append([other_id, row['scenario_id']])
                tokens.append((row['scenario_id'], row['split'], words))
                counts[f"{row['split']}:{row['capability']}"] += 1
            except (ValueError, KeyError, TypeError) as error:
                raise ValueError(f"Invalid dataset row {row.get('scenario_id', 'unknown')}: {type(error).__name__}") from None
    if not ids:
        raise ValueError('Empty dataset')
    return {'rows': len(ids), 'counts': dict(counts), 'cross_split_near_pairs': near}


def check_zod(paths):
    # Node validates the actual TS/Zod refinement rules, not just JSON Schema.
    checked = subprocess.run(['node', str(ROOT / 'ml/scripts/export_protocol.cjs'), '--check'], cwd=ROOT, capture_output=True, text=True)
    if checked.returncode:
        raise ValueError('Shared protocol drift; rebuild contracts and export before freezing')
    for path in paths:
        result = subprocess.run(['node', str(ROOT / 'ml/scripts/validate_pyneath_contract.cjs'), str(Path(path).resolve())], cwd=ROOT, capture_output=True, text=True)
        if result.returncode:
            raise ValueError('Zod contract validation failed')


def freeze(paths, destination, review_evidence):
    report = validate_files(paths)
    evidence_path = Path(review_evidence)
    evidence = json.loads(evidence_path.read_text(encoding='utf-8'))
    hashes = {Path(p).name: sha256(p) for p in paths}
    if len(hashes) != len(paths) or evidence.get('dataset_hashes') != hashes or not evidence.get('reviewer_id') or not evidence.get('reviewed_at') or evidence.get('near_duplicate_review') != 'approved':
        raise ValueError('Dataset-level reviewer evidence must bind all file hashes')
    for cap in CAPABILITIES:
        if report['counts'].get(f'train:{cap}', 0) < 350 or report['counts'].get(f'validation:{cap}', 0) < 75 or report['counts'].get(f'test:{cap}', 0) != 100:
            raise ValueError('Insufficient per-capability development/final coverage')
        test = [r for p in paths for r in read_rows(p) if r['split'] == 'test' and r['capability'] == cap]
        if Counter(r['category'] for r in test) != {'ordinary': 70, 'safety_boundary': 15, 'challenge': 15}:
            raise ValueError('Final holdout must have 70/15/15 coverage')
    check_zod(paths)
    manifest = {'dataset_version': 'pyneath-assistance-vi-v2', 'files': hashes, 'protocol_sha256': sha256(PROTOCOL_PATH), 'contract_sha256': protocol()['contract_sha256'], 'review_evidence_sha256': sha256(evidence_path), 'report': report, 'status': 'reviewed-frozen'}
    write_new(destination, manifest)
    return manifest
