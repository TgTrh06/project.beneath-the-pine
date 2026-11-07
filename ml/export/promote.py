"""Package immutable passed evidence; this does not deploy or enable a provider."""
import argparse
import json
from pathlib import Path
from ml.training.data import sha256, write_new


def package(artifact_path, report_path, model_path, output):
    artifact = json.loads(Path(artifact_path).read_text())
    report = json.loads(Path(report_path).read_text())
    digest = sha256(model_path)
    gates = report.get('gates')
    if report.get('status') != 'passed' or report.get('identity', {}).get('split') != 'test' or not gates or any(value is not True for value in gates.values()):
        raise ValueError('Promotion requires all final-holdout evaluation gates to pass')
    if report['identity'].get('artifact_sha256') != sha256(artifact_path) or report['identity'].get('model_sha256') != digest:
        raise ValueError('Passed GGUF evaluation must bind this artifact and model')
    if artifact['files'].get(Path(model_path).name) != digest:
        raise ValueError('Model checksum mismatch')
    write_new(output, {**artifact, 'status': 'passed', 'promotion_report_sha256': sha256(report_path), 'evaluated_model_sha256': digest, 'deployment_authorized': False})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('artifact', 'report', 'model', 'output'): parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    package(args.artifact, args.report, args.model, args.output)
