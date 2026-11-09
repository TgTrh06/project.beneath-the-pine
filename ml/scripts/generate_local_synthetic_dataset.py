"""Generate the deterministic, local-only Pyneath synthetic v0 dataset.

The generated data is fictional, private, and suitable only for local pipeline
experiments. It is not an owner-reviewed dataset and must not be used to release
or deploy a model."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.authoring.local_synthetic import generate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="ml/data/private/local-synthetic-v0.jsonl")
    args = parser.parse_args()
    generate(args)


if __name__ == "__main__":
    main()
