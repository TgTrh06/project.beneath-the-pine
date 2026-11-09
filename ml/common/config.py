"""Approved experiment identity and budget configuration."""
import re
from pathlib import Path


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
