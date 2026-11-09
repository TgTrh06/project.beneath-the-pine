"""Merge a reviewed adapter into its exact base, then export candidate GGUF files."""
import argparse
from ml.export.conversion import export_gguf
from ml.common.protocol import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', default=str(ROOT / 'ml/configs/qlora-v2.yaml'))
    parser.add_argument('--run', required=True)
    parser.add_argument('--checkpoint', help='Selected complete checkpoint from the completed training run; otherwise final adapter')
    parser.add_argument('--adapter-report', required=True)
    parser.add_argument('--llama-cpp', required=True)
    parser.add_argument('--llama-revision', required=True)
    parser.add_argument('--quantize-binary', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--quantization', choices=['Q4_K_M', 'Q8_0'], default='Q4_K_M')
    parser.add_argument('--q4-rejection-report')
    args = parser.parse_args()
    export_gguf(args)


if __name__ == '__main__':
    main()
