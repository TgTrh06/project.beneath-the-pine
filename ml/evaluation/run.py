"""Collect private raw predictions for baseline/adapter/GGUF with the same protocol."""
import argparse
from ml.evaluation.predictions import collect
from ml.common.protocol import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--manifest', help='Defaults to manifest.json beside dataset')
    parser.add_argument('--config', default=str(ROOT / 'ml/configs/qlora-v2.yaml'))
    parser.add_argument('--output', required=True)
    parser.add_argument('--adapter')
    parser.add_argument('--server-url')
    parser.add_argument('--model-id')
    parser.add_argument('--artifact', help='GGUF artifact manifest required for server evaluation')
    parser.add_argument('--model-file', help='Actual GGUF file served by this local server')
    parser.add_argument('--candidate-record', help='Required to open the final test set; immutable selection evidence')
    args = parser.parse_args()
    if args.adapter and args.server_url:
        parser.error('Choose either a Python adapter or a GGUF server')
    collect(args)


if __name__ == '__main__':
    main()
