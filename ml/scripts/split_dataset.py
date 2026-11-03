"""Create deterministic, capability-stratified train/validation/test JSONL splits."""
from __future__ import annotations
import argparse
import json
import random
from collections import defaultdict
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output_dir")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    from pyneath_dataset import CAPABILITIES, read_rows, split_rows, validate_file
    first = next(read_rows(args.source), None)
    if first is not None and first.get("capability") in CAPABILITIES:
        validate_file(args.source)
        rows = list(read_rows(args.source))
        splits = split_rows(rows, args.seed if args.seed is not None else 20261029)
        target = Path(args.output_dir)
        if any((target / f"{name}.jsonl").exists() for name in splits):
            raise SystemExit("Refusing to overwrite frozen splits")
        target.mkdir(parents=True, exist_ok=True)
        for name, group in splits.items():
            with (target / f"{name}.jsonl").open("x", encoding="utf-8", newline="\n") as handle:
                for row in group:
                    handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
            print(f"{name}: {len(group)}")
        return
    buckets: dict[str, list[dict]] = defaultdict(list)
    for line in Path(args.source).read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line); buckets[row["capability"]].append(row)
    rng = random.Random(args.seed if args.seed is not None else 20260814)
    splits: dict[str, list[dict]] = {"train": [], "validation": [], "test": []}
    for rows in buckets.values():
        rng.shuffle(rows); size = len(rows); train_end = round(size * .70); validation_end = train_end + round(size * .15)
        splits["train"].extend(rows[:train_end]); splits["validation"].extend(rows[train_end:validation_end]); splits["test"].extend(rows[validation_end:])
    target = Path(args.output_dir); target.mkdir(parents=True, exist_ok=True)
    for name, rows in splits.items():
        rows.sort(key=lambda row: row["scenario_id"])
        (target / f"{name}.jsonl").write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
        print(f"{name}: {len(rows)}")


if __name__ == "__main__":
    main()
