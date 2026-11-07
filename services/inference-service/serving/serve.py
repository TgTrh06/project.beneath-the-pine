"""Launch a pinned llama-server on loopback; never exposes the token in argv."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def command(binary, model, alias, port, gpu_layers):
    return [str(binary), '--model', str(model), '--alias', alias, '--host', '127.0.0.1', '--port', str(port),
            '--ctx-size', '4096', '--parallel', '2', '--n-predict', '512', '--n-gpu-layers', str(gpu_layers), '--log-disable']


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--binary', required=True)
    parser.add_argument('--binary-sha256', required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--artifact', required=True)
    parser.add_argument('--model-id', required=True)
    parser.add_argument('--port', type=int, default=8011)
    parser.add_argument('--gpu-layers', type=int, default=0)
    args = parser.parse_args()
    if digest(args.binary) != args.binary_sha256:
        raise ValueError('Binary checksum mismatch')
    artifact = json.loads(Path(args.artifact).read_text())
    if artifact.get('status') not in ('candidate', 'passed') or artifact['files'].get(Path(args.model).name) != digest(args.model):
        raise ValueError('Model artifact checksum mismatch')
    token = os.environ.get('PYNEATH_INFERENCE_TOKEN', '')
    if len(token) < 24:
        raise ValueError('PYNEATH_INFERENCE_TOKEN must have at least 24 characters')
    if not 1024 <= args.port <= 65535 or args.gpu_layers < 0:
        raise ValueError('Invalid port/GPU layers')
    environment = {**os.environ, 'LLAMA_API_KEY': token}
    subprocess.run(command(args.binary, args.model, args.model_id, args.port, args.gpu_layers), env=environment, check=True)
