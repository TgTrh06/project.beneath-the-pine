"""Complete checkpoint verification, durable publication and run identity registry."""
import json
import math
import shutil
from pathlib import Path
from .files import sha256, write_new


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
