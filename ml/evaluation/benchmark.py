"""End-to-end Assistance benchmark against a disposable, authenticated API."""
import argparse
from ml.evaluation.measurement import benchmark


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api-origin', required=True)
    parser.add_argument('--cases', required=True, help='Fictional request JSONL; no production traffic')
    parser.add_argument('--output', required=True)
    parser.add_argument('--hardware-evidence', required=True, help='JSON: hardware, model_load_ms, peak_ram_mb, peak_vram_mb, tokens_per_second, model_sha256')
    args = parser.parse_args()
    benchmark(args)


if __name__ == '__main__':
    main()
