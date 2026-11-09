"""Build the private, compositional Pyneath v1 draft; no network or model calls.

Authoring banks must be supplied separately and stay outside Git. Existing output
files are never overwritten. Technical validation is not human approval."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.authoring.v1_candidates import generate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--authoring", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    generate(args)


if __name__ == "__main__":
    main()
