"""Package immutable passed evidence; this does not deploy or enable a provider."""
import argparse
from ml.export.promotion import package


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('artifact', 'report', 'model', 'output'): parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    package(args.artifact, args.report, args.model, args.output)


if __name__ == '__main__':
    main()
