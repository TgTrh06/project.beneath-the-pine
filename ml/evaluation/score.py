"""Human scores + backend policy evidence; never infer human review from model output."""
import argparse
from ml.evaluation.scoring import score


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--reviews', required=True)
    parser.add_argument('--baseline-report')
    parser.add_argument('--adapter-reference', help='For GGUF: passed adapter report, use regression gates rather than claiming a grammar-induced improvement')
    parser.add_argument('--training-result', help='Attach measured eval_loss for deterministic validation tie-breaking')
    parser.add_argument('--checkpoint', help='When scoring a checkpoint, use its recorded eval_loss')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    score(args)


if __name__ == '__main__':
    main()
