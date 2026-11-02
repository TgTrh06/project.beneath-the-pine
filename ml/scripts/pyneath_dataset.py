"""Strict draft/ready validation and deterministic family splits for Assistance v1."""
from __future__ import annotations

import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

CAPABILITIES = {"assisted_start", "open_seed_draft"}
REQUIRED = {"scenario_id", "scenario_group_id", "split_group_id", "dataset_version", "capability",
            "messages", "domain", "category", "difficulty", "safety_tags", "provenance_class",
            "provenance_stage", "review_status", "reviewer_id", "reviewed_at", "usage",
            "license_status", "expected_status", "source_utterance_used", "split"}


def require(condition, row, reason):
    if not condition:
        raise ValueError(f"{row.get('scenario_id', 'unknown')}: {reason}")


def validate_row(row, require_reviewed=False):
    require(isinstance(row, dict), {}, "row must be an object")
    require(REQUIRED <= row.keys(), row, "missing required metadata")
    for key in ("scenario_id", "scenario_group_id", "split_group_id", "dataset_version", "domain"):
        require(isinstance(row[key], str) and bool(row[key].strip()), row, f"invalid {key}")
    capability = row["capability"]
    require(capability in CAPABILITIES, row, "unsupported capability")
    require(row["difficulty"] in {"easy", "moderate", "hard"}, row, "invalid difficulty")
    require(row["category"] in {"assisted_start", "open_seed_draft", "challenge", "safety_boundary"}, row, "invalid category")
    if row["category"] in CAPABILITIES:
        require(row["category"] == capability, row, "category/capability mismatch")
    require(isinstance(row["safety_tags"], list) and all(isinstance(t, str) and t for t in row["safety_tags"]), row, "invalid tags")
    require(row["provenance_class"] in {"owned_fictional_authoring", "consented_contributor", "synthetic_draft_rewritten"}, row, "invalid provenance")
    require(row["source_utterance_used"] is False, row, "external source row prohibited")
    require(row["review_status"] in {"pending_review", "approved", "rejected"}, row, "invalid review status")
    require(row["split"] in {"train", "validation", "test"}, row, "invalid split")
    if row["review_status"] != "approved":
        require(row["usage"] == "draft/local-only", row, "unreviewed rows must remain drafts")
        require(row["reviewer_id"] is None and row["reviewed_at"] is None, row, "unreviewed row claims sign-off")
    if row["review_status"] == "approved" or require_reviewed:
        require(row["review_status"] == "approved", row, "human review required before training-ready use")
        require(bool(row["reviewer_id"]) and bool(row["reviewed_at"]), row, "missing reviewer evidence")
        require(row["provenance_stage"] == "reviewed", row, "provenance review incomplete")
        require(row["license_status"] == "owner_approved", row, "license decision incomplete")
    messages = row["messages"]
    require(isinstance(messages, list) and len(messages) == 3, row, "expected system/user/assistant")
    require(all(isinstance(m, dict) and set(m) == {"role", "content"} for m in messages), row, "invalid message fields")
    require([m["role"] for m in messages] == ["system", "user", "assistant"], row, "invalid role sequence")
    require(all(isinstance(m["content"], str) and m["content"].strip() for m in messages), row, "empty message")
    try:
        request = json.loads(messages[1]["content"])
        output = json.loads(messages[2]["content"])
    except (ValueError, TypeError) as error:
        raise ValueError(f"{row['scenario_id']}: invalid request/output JSON") from error
    field = "description" if capability == "assisted_start" else "context"
    require(isinstance(request, dict) and set(request) == {"capability", field}, row, "invalid request fields")
    require(request["capability"] == capability, row, "request capability mismatch")
    require(isinstance(request[field], str) and 1 <= len(request[field].strip()) <= (280 if field == "description" else 500), row, "request length invalid")
    base = {"capability", "version", "needsHumanSupport", "fallback"}
    require(isinstance(output, dict) and base <= output.keys(), row, "invalid output object")
    require(output["capability"] == capability and output["version"] == "1", row, "output version/capability mismatch")
    require(type(output["needsHumanSupport"]) is bool, row, "support flag must be boolean")
    require(output["fallback"] in {"manual_step", "take_break", "stop_and_return"}, row, "invalid fallback")
    status = row["expected_status"]
    require(status in {"suggestion", "fallback", "boundary"}, row, "invalid expected status")
    if status in {"boundary", "fallback"}:
        require(set(output) == base | {"message"}, row, "fallback/boundary must not coach")
        require(isinstance(output["message"], str) and 1 <= len(output["message"].strip()) <= 300, row, "invalid message")
        require(output["needsHumanSupport"] == (status == "boundary"), row, "boundary flag mismatch")
        require(output["fallback"] == ("stop_and_return" if status == "boundary" else "manual_step"), row, "boundary fallback mismatch")
    else:
        require(output["needsHumanSupport"] is False, row, "suggestion cannot claim human support")
        answer_field = "activationStep" if capability == "assisted_start" else "openSeedDraft"
        expected = base | {answer_field} | ({"estimatedMinutes"} if capability == "assisted_start" else set())
        require(set(output) == expected, row, "unexpected output fields")
        require(isinstance(output[answer_field], str) and 1 <= len(output[answer_field].strip()) <= (280 if capability == "assisted_start" else 500), row, "answer length invalid")
        if capability == "assisted_start":
            require(type(output["estimatedMinutes"]) is int and output["estimatedMinutes"] in {3, 5, 10}, row, "invalid estimated duration")
    return request, output


def read_rows(path):
    with Path(path).open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            if line.strip():
                try:
                    yield json.loads(line)
                except ValueError as error:
                    raise ValueError(f"Invalid JSON at line {number}") from error


def validate_file(path, require_reviewed=False):
    ids, requests, scenario_groups, families = set(), set(), {}, {}
    counts, statuses = Counter(), Counter()
    count = 0
    for row in read_rows(path):
        request, _ = validate_row(row, require_reviewed)
        require(row["scenario_id"] not in ids, row, "duplicate id")
        ids.add(row["scenario_id"])
        signature = json.dumps(request, ensure_ascii=False, sort_keys=True)
        require(signature not in requests, row, "duplicate request")
        requests.add(signature)
        for mapping, key in ((scenario_groups, "scenario_group_id"), (families, "split_group_id")):
            previous = mapping.setdefault(row[key], row["split"])
            require(previous == row["split"], row, "group crosses splits")
        counts[row["capability"]] += 1
        statuses[row["expected_status"]] += 1
        count += 1
    if not count:
        raise ValueError("Empty dataset")
    return {"rows": count, "capabilities": dict(counts), "statuses": dict(statuses),
            "sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest()}


def split_rows(rows, seed=20261029):
    domains, family_domains = defaultdict(set), {}
    for row in rows:
        family, domain = row["split_group_id"], row["domain"]
        if family in family_domains and family_domains[family] != domain:
            raise ValueError("Family belongs to multiple domains")
        family_domains[family] = domain
        domains[domain].add(family)
    assignment, rng = {}, random.Random(seed)
    for domain in sorted(domains):
        families = sorted(domains[domain])
        if len(families) < 10:
            raise ValueError("Need at least ten task families per domain for 80/10/10")
        rng.shuffle(families)
        train_end, val_end = round(.8 * len(families)), round(.9 * len(families))
        for i, family in enumerate(families):
            assignment[family] = "train" if i < train_end else "validation" if i < val_end else "test"
    result = {name: [] for name in ("train", "validation", "test")}
    for row in rows:
        name = assignment[row["split_group_id"]]
        if row.get("split") != name:
            raise ValueError("Frozen split disagrees with requested seed; create a new dataset version")
        result[name].append(row)
    return result
