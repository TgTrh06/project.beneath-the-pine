"""Frozen training dataset manifest validation before model allocation."""
import json
from pathlib import Path
from .files import read_rows, sha256
from .protocol import PROTOCOL_PATH
from .datasets import check_zod, validate_files


def verify_manifest(train, validation, manifest_path):
    manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    if manifest.get('status') != 'reviewed-frozen' or manifest.get('protocol_sha256') != sha256(PROTOCOL_PATH):
        raise ValueError('Frozen reviewed manifest/protocol required')
    for path, split in ((train, 'train'), (validation, 'validation')):
        if manifest['files'].get(Path(path).name) != sha256(path):
            raise ValueError('Dataset checksum mismatch')
        if any(row['split'] != split for row in read_rows(path)):
            raise ValueError('Training file has incorrect split')
    validate_files([train, validation], reviewed=True)
    check_zod([train, validation])
    return manifest
