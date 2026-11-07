"""Validate/freeze v2 data. Review decisions must be supplied by a human."""
import argparse
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.training.data import freeze, validate_files

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+')
    parser.add_argument('--allow-drafts', action='store_true')
    parser.add_argument('--freeze')
    parser.add_argument('--review-evidence')
    args = parser.parse_args()
    if args.freeze:
        if args.allow_drafts or not args.review_evidence:
            parser.error('Freeze requires human evidence and reviewed data')
        result = freeze(args.files, args.freeze, args.review_evidence)
    else:
        result = validate_files(args.files, not args.allow_drafts)
    print(json.dumps(result, ensure_ascii=False))
