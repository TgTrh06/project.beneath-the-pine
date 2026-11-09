"""Prepare anonymous review forms, then import actual human scores without inventing them."""
import argparse
from ml.evaluation.review import prepare, import_scores


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    prep = sub.add_parser('prepare'); prep.add_argument('--runs', nargs='+', required=True); prep.add_argument('--output', required=True)
    imp = sub.add_parser('import'); imp.add_argument('--form', required=True); imp.add_argument('--mapping', required=True); imp.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.action == 'prepare': prepare(args.runs, args.output)
    else: import_scores(args.form, args.mapping, args.output)


if __name__ == '__main__':
    main()
