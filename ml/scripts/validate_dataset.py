"""Validate private JSONL data without printing scenario text."""
from __future__ import annotations
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

REQUIRED = {"scenario_id", "capability", "messages", "safety_tags", "difficulty"}
ALLOWED = {"brain_dump", "help_me_start"}


def fail(scenario_id: str, message: str) -> None:
    raise SystemExit(f"{scenario_id}: {message}")


def validate_output(row: dict) -> None:
    scenario_id = row["scenario_id"]
    messages = row["messages"]
    if not isinstance(messages, list) or len(messages) != 2:
        fail(scenario_id, "messages must be one user/assistant pair")
    if [message.get("role") for message in messages] != ["user", "assistant"]:
        fail(scenario_id, "messages must have user then assistant roles")
    try:
        output = json.loads(messages[1]["content"])
    except (KeyError, TypeError, json.JSONDecodeError) as error:
        fail(scenario_id, f"assistant content must be JSON: {error}")
    safety = output.get("safety")
    if not isinstance(safety, dict) or not isinstance(safety.get("needsHumanSupport"), bool):
        fail(scenario_id, "output must include safety.needsHumanSupport boolean")
    if "message" in safety and (not isinstance(safety["message"], str) or len(safety["message"]) > 400):
        fail(scenario_id, "safety.message must be a string of at most 400 characters")
    if row["capability"] == "brain_dump":
        if set(output) != {"acknowledgement", "candidates", "safety"}:
            fail(scenario_id, "brain_dump output fields do not match contract")
        candidates = output["candidates"]
        if not isinstance(candidates, list) or not 1 <= len(candidates) <= 4:
            fail(scenario_id, "brain_dump must have 1-4 candidates")
        for candidate in candidates:
            if not isinstance(candidate, dict) or set(candidate) != {"title", "minutes"}:
                fail(scenario_id, "candidate fields do not match contract")
            if not isinstance(candidate["title"], str) or not 2 <= len(candidate["title"]) <= 280:
                fail(scenario_id, "candidate title length is invalid")
            if not isinstance(candidate["minutes"], int) or not 1 <= candidate["minutes"] <= 10:
                fail(scenario_id, "candidate minutes must be 1-10")
    else:
        if set(output) != {"acknowledgement", "tinyStep", "options", "minutes", "safety"}:
            fail(scenario_id, "help_me_start output fields do not match contract")
        if not isinstance(output["tinyStep"], str) or not 2 <= len(output["tinyStep"]) <= 280:
            fail(scenario_id, "tinyStep length is invalid")
        if not isinstance(output["options"], list) or len(output["options"]) > 3 or not all(isinstance(option, str) and 2 <= len(option) <= 220 for option in output["options"]):
            fail(scenario_id, "options must contain at most 3 valid strings")
        if not isinstance(output["minutes"], int) or not 1 <= output["minutes"] <= 10:
            fail(scenario_id, "minutes must be 1-10")
    if not isinstance(output.get("acknowledgement"), str) or len(output["acknowledgement"]) > 280:
        fail(scenario_id, "acknowledgement length is invalid")


def main(path: str) -> None:
    rows = [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]
    ids = [row.get("scenario_id") for row in rows]
    if len(ids) != len(set(ids)):
        raise SystemExit("Duplicate scenario_id")
    for row in rows:
        if not REQUIRED <= set(row): raise SystemExit(f"Missing required fields in {row.get('scenario_id', 'unknown')}")
        if row["capability"] not in ALLOWED: raise SystemExit("Unsupported capability")
        validate_output(row)
    digest = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    print(json.dumps({"rows": len(rows), "capabilities": Counter(row["capability"] for row in rows), "sha256": digest}, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
