"""Content-bound dataset review rules and aggregate coverage; no model runtime."""
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone

from .datasets import normalize, validate_row
from .protocol import CAPABILITIES


REVIEW_FIELDS = {'review_status', 'reviewer_id', 'reviewed_at', 'license_status', 'usage', 'provenance_stage'}
SCORES = ('relevance', 'specificity', 'feasibility', 'no_invention', 'vietnamese_tone')
CHECKS = ('contract', 'policy', 'product_behavior', 'provenance')
CATEGORIES = ('ordinary', 'safety_boundary', 'challenge')
RUBRIC_VERSION = 'pyneath-data-review-v1'


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def content_hash(row):
    """Bind every content/group/split/source field; exclude only derived review metadata."""
    return digest({key: value for key, value in row.items() if key not in REVIEW_FIELDS})


def clear_approval(row):
    return {**row, 'review_status': 'pending_review', 'reviewer_id': None, 'reviewed_at': None,
            'license_status': 'private_owner_release_decision_pending', 'usage': 'draft/local-only',
            'provenance_stage': 'unreviewed_draft'}


def display(row):
    return {'request': json.loads(row['messages'][1]['content']), 'output': json.loads(row['messages'][2]['content']),
            'category': row['category'], 'expected_status': row['expected_status'],
            'split': row['split'], 'domain': row['domain'], 'difficulty': row['difficulty'],
            'safety_tags': row['safety_tags'], 'provenance_class': row['provenance_class'],
            'scenario_group_id': row['scenario_group_id'], 'split_group_id': row['split_group_id']}


def decision_form(row):
    return {'scenario_id': row['scenario_id'], 'content_sha256': content_hash(row), 'display': display(row),
            'decision': None, 'reviewer_id': None, 'reviewed_at': None, 'reason': '',
            'expected_status': None, 'scores': {key: None for key in SCORES},
            'checks': {key: None for key in CHECKS},
            'owner_approval': None, 'independent_authorship': None}


def identity(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'Missing {field}')


def timestamp(value):
    identity(value, 'review timestamp')
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise ValueError('Timestamp must be ISO-8601 with timezone') from None
    if parsed.tzinfo is None or parsed > datetime.now(timezone.utc):
        raise ValueError('Timestamp must have timezone and not be in the future')


def validate_decision(row, decision):
    expected = decision_form(row)
    if set(decision) != set(expected):
        raise ValueError('Unexpected review fields')
    for key in ('scenario_id', 'content_sha256', 'display'):
        if decision[key] != expected[key]:
            raise ValueError('Review content changed; regenerate form for this snapshot')
    if decision['decision'] not in ('approve', 'revise', 'reject', 'escalate'):
        raise ValueError('Actual human decision required')
    identity(decision['reviewer_id'], 'reviewer_id')
    identity(decision['reason'], 'decision reason')
    timestamp(decision['reviewed_at'])
    if decision['decision'] != 'approve':
        return
    if decision['expected_status'] != row['expected_status']:
        raise ValueError('Reviewer status differs from dataset label')
    if set(decision['checks']) != set(CHECKS) or any(value is not True for value in decision['checks'].values()):
        raise ValueError('All mandatory review checks must pass')
    if set(decision['scores']) != set(SCORES):
        raise ValueError('Incomplete quality scores')
    values = list(decision['scores'].values())
    if row['expected_status'] == 'suggestion':
        if any(type(value) is not int or value not in (1, 2) for value in values) or sum(values) < 8:
            raise ValueError('Suggestion requires at least 8/10 and no zero score')
    elif any(value is not None for value in values):
        raise ValueError('Boundary/fallback use mandatory checks, not suggestion scores')
    owner = decision['owner_approval']
    if not isinstance(owner, dict) or set(owner) != {'owner_id', 'approved_at', 'content_sha256', 'permission'}:
        raise ValueError('Actual owner permission required')
    identity(owner['owner_id'], 'owner_id'); timestamp(owner['approved_at'])
    if owner['content_sha256'] != content_hash(row) or owner['permission'] != 'private-training-and-evaluation':
        raise ValueError('Owner permission does not cover this content')
    if row['category'] == 'safety_boundary' and row['expected_status'] != 'boundary':
        raise ValueError('Boundary category must have boundary label')
    author = decision['independent_authorship']
    if row['split'] == 'test':
        fields = {'author_id', 'authored_at', 'content_sha256', 'no_development_rows_seen', 'not_model_output', 'method'}
        if not isinstance(author, dict) or set(author) != fields:
            raise ValueError('Independent holdout authorship evidence required')
        identity(author['author_id'], 'author_id'); identity(author['method'], 'authorship method'); timestamp(author['authored_at'])
        if author['content_sha256'] != content_hash(row) or author['no_development_rows_seen'] is not True or author['not_model_output'] is not True:
            raise ValueError('Holdout independence not attested')
    elif author is not None:
        raise ValueError('Development row must not claim independent holdout authorship')
    approved = {**row, 'review_status': 'approved', 'reviewer_id': decision['reviewer_id'],
                'reviewed_at': decision['reviewed_at'], 'provenance_stage': 'reviewed',
                'license_status': 'owner_approved', 'usage': 'training-approved'}
    validate_row(approved)


def coverage(rows):
    counts, statuses, modes, actions, domains, difficulties = (Counter() for _ in range(6))
    groups = defaultdict(set); sizes = Counter()
    for row in rows:
        cap = row['capability']; split = row['split']
        counts[f'{split}:{cap}:{row["category"]}'] += 1
        statuses[row['review_status']] += 1
        domains[f'{cap}:{row["domain"]}'] += 1
        difficulties[f'{cap}:{row["difficulty"]}'] += 1
        groups[cap].add(row['split_group_id'])
        sizes[(cap, row['split_group_id'])] += 1
        request, output = validate_row(row, reviewed=False)
        if cap == 'stuck_recovery':
            modes[f'{split}:{request["stuckMode"]}'] += 1
            actions[f'{split}:{request["stuckMode"]}:{output.get("recoveryAction", row["expected_status"])}'] += 1
    gaps = []
    for cap in CAPABILITIES:
        for cat, target in zip(CATEGORIES, (350, 75, 75)):
            actual = sum(counts[f'{split}:{cap}:{cat}'] for split in ('train', 'validation'))
            if actual != target:
                gaps.append({'scope': 'development', 'capability': cap, 'category': cat, 'actual': actual, 'target': target})
        for cat, target in zip(CATEGORIES, (70, 15, 15)):
            actual = counts[f'test:{cap}:{cat}']
            if actual != target:
                gaps.append({'scope': 'holdout', 'capability': cap, 'category': cat, 'actual': actual, 'target': target})
    recovery_gaps = []
    for split in ('train', 'validation', 'test'):
        for mode in ('too_large', 'unclear_next_step', 'distracted', 'low_energy'):
            if not modes[f'{split}:{mode}']: recovery_gaps.append(f'{split}:missing_mode:{mode}')
        for action in ('smaller_step', 'different_approach', 'take_break'):
            if not any(key.startswith(split + ':') and key.endswith(':' + action) for key in actions):
                recovery_gaps.append(f'{split}:missing_action:{action}')
    return {'rows': len(rows), 'review_status': dict(statuses), 'counts': dict(counts),
            'domains': dict(domains), 'difficulty': dict(difficulties), 'recovery_modes': dict(modes),
            'recovery_actions_by_mode': dict(actions), 'groups_per_capability': {cap: len(groups[cap]) for cap in CAPABILITIES},
            'groups_above_five': [{'capability': cap, 'group_id': group, 'rows': size} for (cap, group), size in sorted(sizes.items()) if size > 5],
            'coverage_gaps': gaps, 'recovery_gaps': recovery_gaps}


def duplicate_report(rows):
    """Complete lexical screening of input text, across capabilities and within splits too.

    No embeddings or external calls. Same-group similarity is expected but still reported.
    Exact repeated inputs within a capability are blocked by the existing dataset validator.
    """
    prepared = []
    for row in rows:
        request = json.loads(row['messages'][1]['content'])
        text = normalize(request.get('description', request.get('context', request.get('currentStep'))))
        prepared.append((row, text, set(text.split())))
    pairs = []
    for i, (left, text, words) in enumerate(prepared):
        for right, other, other_words in prepared[i + 1:]:
            similarity = len(words & other_words) / max(1, len(words | other_words))
            if text == other or similarity >= .85:
                pair = {'left_id': left['scenario_id'], 'right_id': right['scenario_id'],
                        'left_sha256': content_hash(left), 'right_sha256': content_hash(right),
                        'kind': 'normalized_exact' if text == other else 'lexical_near',
                        'jaccard': round(similarity, 4), 'cross_split': left['split'] != right['split'],
                        'same_group': left['split_group_id'] == right['split_group_id']}
                pair['pair_id'] = digest({key: pair[key] for key in ('left_id', 'right_id', 'left_sha256', 'right_sha256')})
                pairs.append(pair)
    return {'method': 'normalized input text; full pairwise Jaccard >= 0.85; no semantic guarantee',
            'pairs': pairs, 'pairs_count': len(pairs), 'cross_split_count': sum(p['cross_split'] for p in pairs)}
