"""Model-independent validation runs before GPU allocation/download."""
from __future__ import annotations
import importlib.metadata
import json
import math
import re
import shutil
from pathlib import Path
from .data import PROTOCOL_PATH, check_zod, protocol, read_rows, sha256, validate_files


def load_config(path):
    import yaml
    config = yaml.safe_load(Path(path).read_text(encoding='utf-8'))
    if config.get('base_model') != 'Qwen/Qwen2.5-1.5B-Instruct' or not re.fullmatch(r'[a-f0-9]{40}', config.get('base_revision') or ''):
        raise ValueError('Pin the approved base model to an immutable Hugging Face commit SHA')
    if config['learning_rate'] not in (1e-4, 2e-4) or config['epochs'] != 2 or config['max_train_seconds'] != 7200:
        raise ValueError('Configuration exceeds the approved experiment budget')
    for key, expected in {'max_seq_length': 1024, 'lora_r': 16, 'lora_alpha': 32, 'lora_dropout': .05, 'batch_size': 1, 'gradient_accumulation_steps': 8, 'checkpoint_steps': 100, 'seed': 20261029, 'load_in_4bit': True}.items():
        if config.get(key) != expected:
            raise ValueError(f'Unexpected configuration: {key}')
    return config


def environment_versions():
    result = {}
    requirements = Path(__file__).with_name('requirements-colab.txt')
    for line in requirements.read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        package, expected = line.split('==')
        try:
            actual = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            raise ValueError(f'Missing training dependency: {package}') from None
        if actual.split('+')[0] != expected:
            raise ValueError(f'Training dependency mismatch: {package}')
        result[package] = actual
    return result


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


def tokenize_row(tokenizer, row, limit):
    messages = row['messages']
    prefix = tokenizer.apply_chat_template(messages[:2], tokenize=True, add_generation_prompt=True, return_dict=False)
    tokens = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=False, return_dict=False)
    if tokens[:len(prefix)] != prefix or len(tokens) <= len(prefix):
        raise ValueError('Chat template cannot safely mask assistant completion')
    if len(tokens) > limit:
        raise ValueError(f"Token limit exceeded: {row['scenario_id']}")
    return {'input_ids': tokens, 'attention_mask': [1] * len(tokens), 'labels': [-100] * len(prefix) + tokens[len(prefix):]}


def verify_resume(checkpoint, expected):
    checkpoint = Path(checkpoint)
    complete = json.loads((checkpoint / 'complete.json').read_text(encoding='utf-8'))
    if complete['identity'] != expected:
        raise ValueError('Resume identity mismatch')
    elapsed = complete.get('elapsed_train_seconds')
    if type(elapsed) not in (int, float) or not math.isfinite(elapsed) or elapsed < 0:
        raise ValueError('Invalid checkpoint elapsed time')
    required = {'trainer_state.json', 'optimizer.pt', 'scheduler.pt', 'rng_state.pth', 'adapter_model.safetensors', 'adapter_config.json', 'tokenizer_config.json', 'tokenizer.json'}
    if not required <= complete['files'].keys():
        raise ValueError('Incomplete training state')
    for name, digest in complete['files'].items():
        target = (checkpoint / name).resolve()
        if not target.is_relative_to(checkpoint.resolve()) or sha256(target) != digest:
            raise ValueError('Checkpoint checksum mismatch')
    return complete


def publish_checkpoint(source, destination, identity):
    """Retry an interrupted copy; publish its verified completion marker last."""
    source, destination = Path(source), Path(destination)
    complete = verify_resume(source, identity)
    if (destination / 'complete.json').exists():
        if verify_resume(destination, identity) != complete:
            raise ValueError('Refusing to overwrite a different completed checkpoint')
        return
    destination.mkdir(parents=True, exist_ok=True)
    for name, digest in complete['files'].items():
        target = (destination / name).resolve()
        if not target.is_relative_to(destination.resolve()):
            raise ValueError('Checkpoint destination escapes durable storage')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / name, target)
        if sha256(target) != digest:
            raise ValueError('Durable checkpoint checksum mismatch')
    temporary = destination / 'complete.json.pending'
    temporary.write_bytes((source / 'complete.json').read_bytes())
    temporary.replace(destination / 'complete.json')
    verify_resume(destination, identity)


def verify_latest_resume(store, output_name, checkpoint, identity):
    """Do not roll back optimizer progress or the recorded GPU-time budget."""
    selected = verify_resume(checkpoint, identity)
    for marker in (Path(store) / output_name).glob('checkpoint-*/complete.json'):
        saved = verify_resume(marker.parent, identity)
        if saved['elapsed_train_seconds'] > selected['elapsed_train_seconds']:
            raise ValueError('Resume the latest complete durable checkpoint')
    return selected


def claim_run(store, identity, output_name, resume=False):
    """One durable run per configuration; changing a working path cannot reset its budget."""
    import hashlib
    from .data import write_new
    key = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
    path = Path(store) / 'runs' / f'{key}.json'
    if path.exists():
        previous = json.loads(path.read_text())
        if not resume or previous['output_name'] != output_name or previous['identity'] != identity:
            raise ValueError('Configuration already has a durable run; resume it')
    elif resume:
        raise ValueError('Resume requires the original durable run registry')
    else:
        write_new(path, {'identity': identity, 'output_name': output_name})
    return path


class CompletionCollator:
    """Preserve preflight label masks; pad labels with ignore_index."""
    def __init__(self, pad_token_id):
        self.pad_token_id = pad_token_id

    def __call__(self, features):
        import torch
        width = max(len(row['input_ids']) for row in features)
        return {key: torch.tensor([row[key] + [pad] * (width - len(row[key])) for row in features])
                for key, pad in [('input_ids', self.pad_token_id), ('attention_mask', 0), ('labels', -100)]}
