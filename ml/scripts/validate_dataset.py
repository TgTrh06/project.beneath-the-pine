"""Validate private JSONL data without printing scenario text."""
from __future__ import annotations
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

REQUIRED = {"scenario_id", "capability", "messages", "safety_tags", "difficulty"}
ALLOWED = {"brain_dump", "help_me_start"}


def main(path: str) -> None:
    rows = [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]
    ids = [row.get("scenario_id") for row in rows]
    if len(ids) != len(set(ids)):
        raise SystemExit("Duplicate scenario_id")
    for row in rows:
        if not REQUIRED <= set(row): raise SystemExit(f"Missing required fields in {row.get('scenario_id', 'unknown')}")
        if row["capability"] not in ALLOWED: raise SystemExit("Unsupported capability")
        if not isinstance(row["messages"], list) or len(row["messages"]) < 2: raise SystemExit("messages must be an instruction/output pair")
    digest = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    print(json.dumps({"rows": len(rows), "capabilities": Counter(row["capability"] for row in rows), "sha256": digest}, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
