"""Validate private JSONL data without printing scenario text."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.common.legacy_validation import validate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path")
    parser.add_argument("--require-reviewed", action="store_true", help="Reject drafts and rows without reviewer/license sign-off")
    args = parser.parse_args()
    validate(args.path, args.require_reviewed)


if __name__ == "__main__":
    main()
