"""Prepare, review and audit private v2 data; never manufacture human decisions."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.authoring import review_workflow as workflow


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    prepare = commands.add_parser('prepare', help='Copy source rows into an unreviewed immutable snapshot')
    prepare.add_argument('--sources', nargs='+', required=True)
    form = commands.add_parser('form', help='Prepare an editable human decision form')
    form.add_argument('--calibration', action='store_true')
    form.add_argument('--limit', type=int)
    form.add_argument('--reviewer-id')
    form.add_argument('--selection', help='JSON array of IDs; resume the pending rows of the same batch')
    apply = commands.add_parser('apply', help='Apply actual decisions to a new snapshot')
    apply.add_argument('--form', required=True)
    revise = commands.add_parser('revise', help='Edit content and invalidate earlier approval')
    revise.add_argument('--edits', required=True)
    combine = commands.add_parser('combine', help='Combine disjoint snapshots and/or select IDs')
    combine.add_argument('--workspaces', nargs='+', required=True)
    combine.add_argument('--selection')
    audit = commands.add_parser('audit', help='Aggregate coverage and lexical duplicate screening')
    tokens = commands.add_parser('tokens', help='Check cached pinned tokenizer, no weights/GPU/network')
    export = commands.add_parser('export', help='Export reviewed handoff; does not freeze or train')
    export.add_argument('--evidence', required=True)
    export.add_argument('--token-report', required=True)
    for command in (form, apply, revise, audit, tokens, export): command.add_argument('--workspace', required=True)
    for command in (prepare, form, apply, revise, combine, audit, tokens, export): command.add_argument('--output', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'prepare': result = workflow.prepare(args.sources, args.output)
        elif args.command == 'form': result = workflow.form(args.workspace, args.output, args.calibration, args.limit, args.reviewer_id, args.selection)
        elif args.command == 'apply': result = workflow.apply(args.workspace, args.form, args.output)
        elif args.command == 'revise': result = workflow.revise(args.workspace, args.edits, args.output)
        elif args.command == 'combine': result = workflow.combine(args.workspaces, args.output, args.selection)
        elif args.command == 'audit': result = workflow.audit(args.workspace, args.output)
        elif args.command == 'tokens':
            from transformers import AutoTokenizer
            import importlib.metadata
            from ml.common.config import load_config
            from ml.common.files import write_new
            from ml.common.protocol import ROOT
            from ml.training.preflight import dataset_token_report
            rows, _, _, manifest = workflow.load(args.workspace)
            config = load_config(ROOT / 'ml/configs/qlora-v2.yaml')
            tokenizer = AutoTokenizer.from_pretrained(config['base_model'], revision=config['base_revision'], local_files_only=True)
            result = {**dataset_token_report(tokenizer, rows, config['max_seq_length']),
                      'snapshot_id': manifest['snapshot_id'], 'rows_sha256': manifest['files']['rows.jsonl'],
                      'base_model': config['base_model'], 'base_revision': config['base_revision'],
                      'transformers_version': importlib.metadata.version('transformers')}
            write_new(args.output, result)
            if not result['passed']: parser.exit(1, 'Token check failed; see report IDs. No content was truncated.\n')
        else: result = workflow.export(args.workspace, args.evidence, args.token_report, args.output)
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f'Review operation failed: {error}\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
