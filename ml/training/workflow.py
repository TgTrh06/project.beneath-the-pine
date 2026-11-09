"""Offline QLoRA entry point. Full training fails closed without review/smoke evidence."""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

from ml.common.protocol import PROTOCOL_PATH, ROOT
from ml.common.files import read_rows, sha256, write_new
from ml.training.preflight import CompletionCollator, environment_versions, tokenize_row
from ml.common.checkpoints import claim_run, publish_checkpoint, verify_latest_resume, verify_resume
from ml.common.config import load_config
from ml.common.manifests import verify_manifest



def train(args):
    config = load_config(args.config)
    verify_manifest(args.train, args.validation, args.manifest)
    versions = environment_versions()
    identity = {'config_sha256': sha256(args.config), 'dataset_manifest_sha256': sha256(args.manifest), 'protocol_sha256': sha256(PROTOCOL_PATH), 'base_model': config['base_model'], 'base_revision': config['base_revision'], 'versions': versions, 'smoke': args.smoke}
    if not args.smoke:
        if not args.smoke_evidence:
            raise ValueError('A successful GPU smoke run is required')
        smoke = json.loads(Path(args.smoke_evidence).read_text())
        if smoke.get('status') != 'smoke-passed' or smoke.get('identity') != {**identity, 'smoke': True}:
            raise ValueError('Smoke evidence does not match this run')
    previous = verify_latest_resume(args.checkpoint_store, Path(args.output).name, args.resume, identity) if args.resume else None
    used = previous['elapsed_train_seconds'] if previous else 0
    if used >= config['max_train_seconds']:
        raise ValueError('Training time budget exhausted')
    if args.preflight_only:
        print(json.dumps({'status': 'metadata-preflight-passed', 'tokenizer_checked': False}))
        return
    os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
    os.environ['WANDB_DISABLED'] = 'true'
    import unsloth  # Import before transformers as required by its patches.
    import torch
    from unsloth import FastLanguageModel
    from transformers import AutoTokenizer, BitsAndBytesConfig, TrainerCallback
    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer
    if not torch.cuda.is_available():
        raise ValueError('CUDA GPU required; no CPU fallback')
    tokenizer = AutoTokenizer.from_pretrained(config['base_model'], revision=config['base_revision'], trust_remote_code=False)
    datasets = {}
    for name, path in [('train', args.train), ('validation', args.validation)]:
        rows = list(read_rows(path))
        if args.smoke:
            rows = rows[:24]
        datasets[name] = Dataset.from_list([tokenize_row(tokenizer, row, config['max_seq_length']) for row in rows])
    output = Path(args.output).resolve()
    store = Path(args.checkpoint_store).resolve()
    if output == store or output.is_relative_to(store) or store.is_relative_to(output):
        raise ValueError('Working output and durable checkpoint store must be separate')
    if output.exists() and not args.resume:
        raise ValueError('Refusing to overwrite an existing run')
    if args.resume and (output / 'run.json').exists() and json.loads((output / 'run.json').read_text())['identity'] != identity:
        raise ValueError('Output directory belongs to a different run')
    output.mkdir(parents=True, exist_ok=True)
    store.mkdir(parents=True, exist_ok=True)
    claim_run(store, identity, output.name, bool(args.resume))
    if not (output / 'run.json').exists():
        write_new(output / 'run.json', {'identity': identity, 'status': 'candidate', 'gpu': torch.cuda.get_device_name(), 'git_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()})
        (output / 'environment.lock.txt').write_text(subprocess.check_output([os.sys.executable, '-m', 'pip', 'freeze', '--all'], text=True), encoding='utf-8')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    model, tokenizer = FastLanguageModel.from_pretrained(model_name=config['base_model'], revision=config['base_revision'], max_seq_length=config['max_seq_length'], dtype=dtype, load_in_4bit=True, trust_remote_code=False,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=dtype))
    if getattr(model.config, '_commit_hash', None) != config['base_revision']:
        raise ValueError('Loader did not preserve the approved base revision')
    model = FastLanguageModel.get_peft_model(model, r=config['lora_r'], target_modules=config['target_modules'], lora_alpha=config['lora_alpha'], lora_dropout=config['lora_dropout'], bias='none', use_gradient_checkpointing='unsloth', random_state=config['seed'])
    started = time.monotonic()

    class CheckpointBudget(TrainerCallback):
        def on_step_end(self, training_args, state, control, **kwargs):
            if state.global_step >= state.max_steps:
                control.should_save = True
                control.should_evaluate = True
            if used + time.monotonic() - started >= config['max_train_seconds']:
                control.should_training_stop = True
                control.should_save = True
            return control

        def on_save(self, training_args, state, control, **kwargs):
            checkpoint = output / f'checkpoint-{state.global_step}'
            tokenizer.save_pretrained(checkpoint)
            files = {str(p.relative_to(checkpoint)).replace('\\', '/'): sha256(p) for p in checkpoint.rglob('*') if p.is_file() and p.name != 'complete.json'}
            marker = {'identity': identity, 'elapsed_train_seconds': used + time.monotonic() - started, 'files': files}
            write_new(checkpoint / 'complete.json', marker)
            verify_resume(checkpoint, identity)
            publish_checkpoint(checkpoint, store / output.name / checkpoint.name, identity)
            return control

    trainer = SFTTrainer(model=model, processing_class=tokenizer, train_dataset=datasets['train'], eval_dataset=datasets['validation'], data_collator=CompletionCollator(tokenizer.pad_token_id), callbacks=[CheckpointBudget()],
        args=SFTConfig(output_dir=str(output), num_train_epochs=config['epochs'], max_steps=20 if args.smoke else -1,
            learning_rate=config['learning_rate'], per_device_train_batch_size=config['batch_size'], per_device_eval_batch_size=1,
            gradient_accumulation_steps=config['gradient_accumulation_steps'], eval_strategy='steps', eval_steps=20 if args.smoke else 100,
            save_strategy='steps', save_steps=20 if args.smoke else 100, seed=config['seed'], data_seed=config['seed'],
            optim='adamw_8bit', bf16=dtype == torch.bfloat16, fp16=dtype == torch.float16, max_length=1024,
            packing=False, dataset_kwargs={'skip_prepare_dataset': True}, remove_unused_columns=False,
            report_to='none', logging_steps=5, save_only_model=False))
    batch = next(iter(trainer.get_train_dataloader()))
    if not (batch['labels'] == -100).any() or not (batch['labels'] != -100).any():
        raise ValueError('Assistant completion mask not preserved')
    trainer.train(resume_from_checkpoint=args.resume)
    elapsed = used + time.monotonic() - started
    if elapsed >= config['max_train_seconds']:
        write_new(output / 'result.json', {'status': 'budget-exhausted', 'identity': identity, 'elapsed_train_seconds': elapsed})
        return
    trainer.save_model(str(output / 'adapter'))
    tokenizer.save_pretrained(output / 'adapter')
    metrics = trainer.evaluate()
    write_new(output / 'result.json', {'status': 'smoke-passed' if args.smoke else 'candidate', 'identity': identity, 'elapsed_train_seconds': elapsed, 'metrics': metrics, 'global_step': trainer.state.global_step})
    final = store / output.name / 'completed-run'
    if final.exists():
        raise ValueError('Durable result already exists')
    final.mkdir(parents=True)
    for name in ('adapter', 'run.json', 'environment.lock.txt'):
        source = output / name
        if source.is_dir(): shutil.copytree(source, final / name)
        else: shutil.copy2(source, final / name)
    # Copy result last; absent result means the final copy is incomplete.
    shutil.copy2(output / 'result.json', final / 'result.json')
