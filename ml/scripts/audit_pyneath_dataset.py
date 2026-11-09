"""Audit all exact/group invariants plus a bounded, disclosed near-duplicate sample."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.evaluation.v1_audit import audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    audit(args)


if __name__ == "__main__":
    main()
