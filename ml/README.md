# Beneath Pine AI training workspace

This folder contains reproducible code and safe public fixtures only. The reviewed 600-scenario dataset lives in `ml/data/private/` and is excluded from Git. Run `python ml/scripts/validate_dataset.py <private-jsonl>` before every split/train run; record only its SHA-256 and aggregate counts in the model card.
