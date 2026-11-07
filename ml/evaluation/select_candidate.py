"""Freeze a selection made only on validation before opening the final holdout."""
import argparse
import json
from pathlib import Path
from ml.training.data import sha256, write_new


def rank_candidates(eligible):
    if not eligible:
        raise ValueError('No candidate passed validation gates')
    best_quality = max(r['metrics']['quality_mean'] for r in eligible)
    tied = [r for r in eligible if r['metrics']['quality_mean'] == best_quality]
    if len(tied) > 1 and any('eval_loss' not in r for r in tied):
        raise ValueError('Tied candidates require eval_loss from their training run')
    return sorted(eligible, key=lambda r: (-r['metrics']['quality_mean'], r.get('eval_loss', float('inf'))))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reports', nargs='+', required=True)
    parser.add_argument('--test', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    reports = [json.loads(Path(p).read_text()) for p in args.reports]
    if len({r['identity']['config_sha256'] for r in reports}) > 2:
        raise ValueError('At most two training configurations; checkpoints may share a configuration')
    if len({(r['identity']['dataset_sha256'], r['identity']['protocol_sha256'], r['identity']['base_revision']) for r in reports}) != 1:
        raise ValueError('Candidate reports must share validation data, prompt and base revision')
    eligible = []
    for report in reports:
        m = report['metrics']
        if report['identity']['split'] != 'validation' or not report['identity'].get('adapter_sha256'):
            raise ValueError('Only validation-scored adapter candidates may be selected')
        if m['raw_schema_rate'] >= .99 and m['processed_schema_rate'] == 1 and not m['boundary_failures'] and not m['severe_violations'] and m['false_boundary_rate'] <= .05 and min(m['quality_by_capability'].values()) >= .85:
            eligible.append(report)
    # Reports tied on quality must include measured eval_loss, rather than guessing.
    ranked = rank_candidates(eligible)
    selected = ranked[0]
    write_new(args.output, {'status': 'selected-on-validation', 'test_sha256': sha256(args.test), 'adapter_sha256': selected['identity']['adapter_sha256'], 'base_revision': selected['identity']['base_revision'], 'protocol_sha256': selected['identity']['protocol_sha256'], 'source_report_hashes': [sha256(p) for p in args.reports]})
