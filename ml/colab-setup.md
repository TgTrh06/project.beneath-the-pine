# Colab Setup

1. Create a private Google Colab notebook with GPU runtime.
2. Clone this repository at the tagged commit for the run.
3. Install the versions recorded in the notebook output: `pip install unsloth trl datasets peft accelerate`.
4. Upload reviewed private JSONL only to the private runtime/Drive location; do not place it in a public notebook, GitHub or Hugging Face dataset repository.
5. Validate then split data:

```bash
python ml/scripts/validate_dataset.py private/reviewed.jsonl
python ml/scripts/split_dataset.py private/reviewed.jsonl private/splits
python ml/train_colab.py --train private/splits/train.jsonl --validation private/splits/validation.jsonl --output artifacts/adapter-v1
```

6. Record dataset hash, Git commit, Colab package versions, runtime GPU and metrics in the model card before exporting the adapter.
