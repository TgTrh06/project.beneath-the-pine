"""Collect private raw predictions for baseline/adapter/GGUF with the same protocol."""
import json
import os
from pathlib import Path
import time
import urllib.request
from ml.common.protocol import PROTOCOL_PATH, ROOT, protocol
from ml.common.files import read_rows, sha256, write_new
from ml.common.datasets import validate_files
from ml.common.config import load_config


from ml.common.http import NoRedirect



def collect(args):
    if args.adapter and args.server_url:
        raise ValueError('Choose either a Python adapter or a GGUF server')
    config = load_config(args.config)
    manifest_path = Path(args.manifest) if args.manifest else Path(args.dataset).parent / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if manifest.get('status') != 'reviewed-frozen' or manifest['files'].get(Path(args.dataset).name) != sha256(args.dataset) or manifest['protocol_sha256'] != sha256(PROTOCOL_PATH):
        raise ValueError('Evaluation requires the frozen reviewed dataset/protocol')
    validate_files([args.dataset])
    rows = list(read_rows(args.dataset))
    if len({r['split'] for r in rows}) != 1:
        raise ValueError('Evaluate one split at a time')
    if rows[0]['split'] == 'test':
        if not args.candidate_record:
            raise ValueError('Select candidate on validation before opening final holdout')
        choice = json.loads(Path(args.candidate_record).read_text())
        if choice.get('status') != 'selected-on-validation' or choice.get('test_sha256') != sha256(args.dataset):
            raise ValueError('Invalid candidate selection evidence')
        if args.adapter and choice['adapter_sha256'] != sha256(Path(args.adapter) / 'adapter_model.safetensors'):
            raise ValueError('Adapter differs from frozen selection')
    destination = Path(args.output)
    if destination.exists():
        raise ValueError('Refusing to overwrite predictions')
    destination.mkdir(parents=True)
    if args.server_url:
        from urllib.parse import urlparse
        url = urlparse(args.server_url)
        if url.scheme not in ('http', 'https') or url.username or url.password or not args.model_id or not os.environ.get('PYNEATH_INFERENCE_TOKEN') or not args.artifact or not args.model_file:
            raise ValueError('Explicit model, internal URL and token required')
        artifact = json.loads(Path(args.artifact).read_text())
        if artifact['files'].get(Path(args.model_file).name) != sha256(args.model_file):
            raise ValueError('GGUF does not match artifact manifest')
        if artifact['protocol_sha256'] != sha256(PROTOCOL_PATH) or artifact['base_revision'] != config['base_revision']:
            raise ValueError('Artifact protocol/base mismatch')
        if rows[0]['split'] == 'test' and artifact['adapter_sha256'] != choice['adapter_sha256']:
            raise ValueError('Artifact differs from selected adapter')
    else:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        tokenizer = AutoTokenizer.from_pretrained(config['base_model'], revision=config['base_revision'])
        model = AutoModelForCausalLM.from_pretrained(config['base_model'], revision=config['base_revision'], torch_dtype='auto', device_map='auto', trust_remote_code=False)
        if args.adapter:
            from peft import PeftModel
            model = PeftModel.from_pretrained(model, args.adapter)
        model.eval()
    with (destination / 'predictions.jsonl').open('x', encoding='utf-8') as stream:
        for row in rows:
            messages = row['messages'][:2]
            started = time.perf_counter()
            raw, failed = '', False
            try:
                if args.server_url:
                    payload = {'model': args.model_id, 'messages': messages, 'stream': False, 'temperature': 0, 'max_tokens': 512,
                               'response_format': {'type': 'json_schema', 'json_schema': {'name': 'pyneath_assistance', 'strict': True, 'schema': protocol()['output_schema']}}}
                    request = urllib.request.Request(args.server_url.rstrip('/') + '/v1/chat/completions', json.dumps(payload).encode(), {'Authorization': 'Bearer ' + os.environ['PYNEATH_INFERENCE_TOKEN'], 'Content-Type': 'application/json'})
                    with urllib.request.build_opener(NoRedirect()).open(request, timeout=6) as response:
                        body = response.read(32769)
                    if len(body) > 32768:
                        raise ValueError('Response too large')
                    answer = json.loads(body)['choices'][0]
                    if answer['finish_reason'] != 'stop':
                        raise ValueError('Truncated result')
                    raw = answer['message']['content']
                else:
                    tokens = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_tensors='pt', return_dict=False).to(model.device)
                    if tokens.shape[1] + 512 > 2048:
                        raise ValueError('Input exceeds serving context budget')
                    with torch.inference_mode():
                        generated = model.generate(tokens, max_new_tokens=512, do_sample=False)
                    completion = generated[0, tokens.shape[1]:]
                    end_ids = model.generation_config.eos_token_id
                    end_ids = end_ids if isinstance(end_ids, list) else [end_ids]
                    if len(completion) == 512 and int(completion[-1]) not in end_ids:
                        raise ValueError('Truncated result')
                    raw = tokenizer.decode(completion, skip_special_tokens=True)
            except Exception:
                failed = True  # Do not print exception bodies containing private text.
            record = { 'scenario_id': row['scenario_id'], 'capability': row['capability'], 'category': row['category'], 'expected_status': row['expected_status'],
                      'request': json.loads(messages[1]['content']), 'raw': raw, 'error': failed, 'elapsed_ms': round((time.perf_counter() - started) * 1000)}
            stream.write(json.dumps(record, ensure_ascii=False) + '\n'); stream.flush()
    write_new(destination / 'run.json', {'status': 'unscored', 'config_sha256': sha256(args.config), 'dataset_sha256': sha256(args.dataset), 'protocol_sha256': sha256(PROTOCOL_PATH), 'base_revision': config['base_revision'],
                                        'model_id': args.model_id, 'adapter_sha256': sha256(Path(args.adapter) / 'adapter_model.safetensors') if args.adapter else artifact['adapter_sha256'] if args.server_url else None,
                                        'artifact_sha256': sha256(args.artifact) if args.artifact else None,
                                        'model_sha256': sha256(args.model_file) if args.model_file else None,
                                        'predictions_sha256': sha256(destination / 'predictions.jsonl'), 'split': rows[0]['split'], 'constrained_generation': bool(args.server_url)})
