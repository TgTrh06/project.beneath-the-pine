"""Run this file in Google Colab after installing Unsloth, TRL and datasets.

Input JSONL uses `messages`: [{role, content}, ...]. This script never uploads
dataset rows to a third-party service; the notebook owner supplies private paths.
"""
from __future__ import annotations
import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", required=True)
    parser.add_argument("--validation", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-1.5B-Instruct")
    args = parser.parse_args()
    from datasets import load_dataset
    from trl import SFTConfig, SFTTrainer
    from unsloth import FastLanguageModel

    model, tokenizer = FastLanguageModel.from_pretrained(model_name=args.base_model, max_seq_length=1024, load_in_4bit=True)
    model = FastLanguageModel.get_peft_model(model, r=16, target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"], lora_alpha=32, lora_dropout=0.05, bias="none", use_gradient_checkpointing="unsloth", random_state=20260814)
    dataset = load_dataset("json", data_files={"train": args.train, "validation": args.validation})
    def render(row: dict) -> dict[str, str]: return {"text": tokenizer.apply_chat_template(row["messages"], tokenize=False, add_generation_prompt=False)}
    dataset = dataset.map(render)
    trainer = SFTTrainer(model=model, tokenizer=tokenizer, train_dataset=dataset["train"], eval_dataset=dataset["validation"], dataset_text_field="text", max_seq_length=1024, args=SFTConfig(output_dir=args.output, num_train_epochs=3, learning_rate=2e-4, per_device_train_batch_size=2, gradient_accumulation_steps=4, eval_strategy="epoch", save_strategy="epoch", seed=20260814, logging_steps=5, report_to="none"))
    trainer.train()
    Path(args.output).mkdir(parents=True, exist_ok=True)
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)


if __name__ == "__main__":
    main()
