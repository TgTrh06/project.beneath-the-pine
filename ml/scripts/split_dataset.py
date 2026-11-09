"""Create deterministic, capability-stratified train/validation/test JSONL splits."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.authoring.splits import split


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output_dir")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    split(args)


if __name__ == "__main__":
    main()
