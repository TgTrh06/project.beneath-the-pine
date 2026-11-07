"""Merge a reviewed adapter into its exact base, then export candidate GGUF files."""
import argparse
import json
from pathlib import Path
import re
import subprocess
from ml.training.data import PROTOCOL_PATH, ROOT, sha256, write_new
from ml.training.preflight import load_config, verify_resume


def verify_export_inputs(config_path, run, report_path, checkpoint=None):
    config = load_config(config_path)
    run = Path(run)
    result = json.loads((run / 'result.json').read_text())
    report = json.loads(Path(report_path).read_text())
    if result['status'] != 'candidate' or result['identity']['smoke'] or report['status'] != 'passed' or report['identity'].get('split') != 'test' or not report.get('gates') or any(value is not True for value in report['gates'].values()):
        raise ValueError('Completed non-smoke training and passed adapter evaluation required')
    if result['identity']['config_sha256'] != sha256(config_path) or result['identity']['base_revision'] != config['base_revision']:
        raise ValueError('Base/config mismatch')
    adapter = Path(checkpoint) if checkpoint else run / 'adapter'
    if checkpoint:
        verify_resume(adapter, result['identity'])
    if report['identity']['adapter_sha256'] != sha256(adapter / 'adapter_model.safetensors') or report['identity']['protocol_sha256'] != sha256(PROTOCOL_PATH):
        raise ValueError('Evaluation does not bind this adapter/protocol')
    return config, result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', default=str(ROOT / 'ml/configs/qlora-v2.yaml'))
    parser.add_argument('--run', required=True)
    parser.add_argument('--checkpoint', help='Selected complete checkpoint from the completed training run; otherwise final adapter')
    parser.add_argument('--adapter-report', required=True)
    parser.add_argument('--llama-cpp', required=True)
    parser.add_argument('--llama-revision', required=True)
    parser.add_argument('--quantize-binary', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--quantization', choices=['Q4_K_M', 'Q8_0'], default='Q4_K_M')
    parser.add_argument('--q4-rejection-report')
    args = parser.parse_args()
    config, result = verify_export_inputs(args.config, args.run, args.adapter_report, args.checkpoint)
    adapter = Path(args.checkpoint) if args.checkpoint else Path(args.run) / 'adapter'
    if not re.fullmatch('[a-f0-9]{40}', args.llama_revision) or subprocess.check_output(['git', '-C', args.llama_cpp, 'rev-parse', 'HEAD'], text=True).strip() != args.llama_revision:
        raise ValueError('llama.cpp checkout must match immutable revision')
    if subprocess.check_output(['git', '-C', args.llama_cpp, 'status', '--porcelain'], text=True).strip():
        raise ValueError('llama.cpp checkout must be clean')
    if args.quantization == 'Q8_0':
        if not args.q4_rejection_report:
            raise ValueError('Q8 retry requires a rejected Q4 evaluation')
        rejected = json.loads(Path(args.q4_rejection_report).read_text())
        if rejected.get('status') != 'rejected' or not rejected['identity'].get('artifact_sha256') or rejected['identity'].get('adapter_sha256') != sha256(adapter / 'adapter_model.safetensors'):
            raise ValueError('Q4 rejection does not belong to this adapter')
    destination = Path(args.output)
    if destination.exists():
        raise ValueError('Refusing to overwrite export')
    destination.mkdir(parents=True)
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    base = AutoModelForCausalLM.from_pretrained(config['base_model'], revision=config['base_revision'], torch_dtype=torch.float16, device_map='cpu', trust_remote_code=False)
    model = PeftModel.from_pretrained(base, str(adapter)).merge_and_unload()
    merged = destination / 'merged'
    model.save_pretrained(merged, safe_serialization=True)
    tokenizer = AutoTokenizer.from_pretrained(adapter)
    tokenizer.save_pretrained(merged)
    f16 = destination / 'model-f16.gguf'
    quantized = destination / f'model-{args.quantization.lower()}.gguf'
    subprocess.run([__import__('sys').executable, str(Path(args.llama_cpp) / 'convert_hf_to_gguf.py'), str(merged), '--outfile', str(f16), '--outtype', 'f16'], check=True)
    subprocess.run([args.quantize_binary, str(f16), str(quantized), args.quantization], check=True)
    write_new(destination / 'artifact.json', {'status': 'candidate', 'base_model': config['base_model'], 'base_revision': config['base_revision'], 'license': config['license'],
        'adapter_sha256': sha256(adapter / 'adapter_model.safetensors'), 'adapter_report_sha256': sha256(args.adapter_report),
        'protocol_sha256': sha256(PROTOCOL_PATH), 'llama_revision': args.llama_revision, 'quantize_binary_sha256': sha256(args.quantize_binary),
        'files': {p.name: sha256(p) for p in (f16, quantized)}, 'chat_template_sha256': __import__('hashlib').sha256(tokenizer.chat_template.encode()).hexdigest(),
        'training_identity': result['identity'], 'quantization': args.quantization})


if __name__ == '__main__':
    main()
