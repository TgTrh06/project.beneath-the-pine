"""Offline QLoRA entry point. Full training fails closed without review/smoke evidence."""
import argparse
from ml.training.workflow import train
from ml.common.protocol import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', default=str(ROOT / 'ml/configs/qlora-v2.yaml'))
    parser.add_argument('--train', required=True)
    parser.add_argument('--validation', required=True)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--checkpoint-store', required=True, help='Explicit private durable directory, e.g. mounted Drive')
    parser.add_argument('--resume')
    parser.add_argument('--smoke', action='store_true')
    parser.add_argument('--smoke-evidence')
    parser.add_argument('--preflight-only', action='store_true')
    args = parser.parse_args()
    train(args)


if __name__ == '__main__':
    main()
