"""Build review candidates, never training-ready rows or a fabricated independent holdout."""
import argparse
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.authoring.candidates import generate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    print(json.dumps(generate(args.source, args.output)))


if __name__ == '__main__':
    main()
