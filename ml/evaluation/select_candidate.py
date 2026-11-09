"""Freeze a selection made only on validation before opening the final holdout."""
import argparse
from ml.evaluation.selection import select_candidate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reports', nargs='+', required=True)
    parser.add_argument('--test', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    select_candidate(args)


if __name__ == '__main__':
    main()
