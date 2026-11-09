"""Training environment and assistant-only tokenization checks."""
import importlib.metadata
from pathlib import Path


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


def tokenize_row(tokenizer, row, limit):
    messages = row['messages']
    prefix = tokenizer.apply_chat_template(messages[:2], tokenize=True, add_generation_prompt=True, return_dict=False)
    tokens = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=False, return_dict=False)
    if tokens[:len(prefix)] != prefix or len(tokens) <= len(prefix):
        raise ValueError('Chat template cannot safely mask assistant completion')
    if len(tokens) > limit:
        raise ValueError(f"Token limit exceeded: {row['scenario_id']}")
    return {'input_ids': tokens, 'attention_mask': [1] * len(tokens), 'labels': [-100] * len(prefix) + tokens[len(prefix):]}


class CompletionCollator:
    """Preserve preflight label masks; pad labels with ignore_index."""
    def __init__(self, pad_token_id):
        self.pad_token_id = pad_token_id

    def __call__(self, features):
        import torch
        width = max(len(row['input_ids']) for row in features)
        return {key: torch.tensor([row[key] + [pad] * (width - len(row[key])) for row in features])
                for key, pad in [('input_ids', self.pad_token_id), ('attention_mask', 0), ('labels', -100)]}
