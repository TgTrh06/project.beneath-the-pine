"""Focused invariants: malformed outputs, review gating, leakage and frozen splits."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from ml.common.v1_dataset import split_rows, validate_file, validate_row


def fixture(capability="assisted_start", status="suggestion"):
    output = {"capability": capability, "version": "1", "needsHumanSupport": status == "boundary", "fallback": "stop_and_return" if status == "boundary" else "manual_step"}
    if status != "suggestion":
        output["message"] = "Fixed test fallback."
    elif capability == "assisted_start":
        output.update(activationStep="Read one heading.", estimatedMinutes=3)
    else:
        output["openSeedDraft"] = "Return to the marked heading."
    return {"scenario_id": "test-1", "scenario_group_id": "scenario-1", "split_group_id": "family-1",
            "dataset_version": "test", "capability": capability, "domain": "study", "category": "challenge",
            "difficulty": "hard", "safety_tags": [], "provenance_class": "synthetic_draft_rewritten",
            "provenance_stage": "unreviewed_synthetic_draft", "review_status": "pending_review",
            "reviewer_id": None, "reviewed_at": None, "usage": "draft/local-only",
            "license_status": "private_owner_release_decision_pending", "expected_status": status,
            "source_utterance_used": False, "split": "train",
            "messages": [{"role": "system", "content": "Test instructions"},
                         {"role": "user", "content": json.dumps({"capability": capability, "description" if capability == "assisted_start" else "context": "Test task"})},
                         {"role": "assistant", "content": json.dumps(output)}]}


def mutate_output(row, **changes):
    output = json.loads(row["messages"][2]["content"])
    output.update(changes)
    row["messages"][2]["content"] = json.dumps(output)
    return row


class DatasetTests(unittest.TestCase):
    def test_both_capabilities_and_three_response_modes(self):
        for capability in ("assisted_start", "open_seed_draft"):
            for status in ("suggestion", "fallback", "boundary"):
                validate_row(fixture(capability, status))

    def test_boundary_must_not_contain_coaching(self):
        with self.assertRaises(ValueError):
            validate_row(mutate_output(fixture(status="boundary"), activationStep="Keep working"))

    def test_cross_capability_fields_rejected(self):
        with self.assertRaises(ValueError):
            validate_row(mutate_output(fixture(), openSeedDraft="Extra output"))

    def test_invalid_durations_and_types_rejected(self):
        for duration in (True, 2, 7, "5", 3.0):
            with self.subTest(duration=duration), self.assertRaises(ValueError):
                validate_row(mutate_output(fixture(), estimatedMinutes=duration))

    def test_model_cannot_supply_persistence_identifier(self):
        with self.assertRaises(ValueError):
            validate_row(mutate_output(fixture(), suggestionId="invented-id"))

    def test_draft_cannot_claim_training_readiness(self):
        with self.assertRaisesRegex(ValueError, "human review required"):
            validate_row(fixture(), require_reviewed=True)
        row = fixture()
        row.update(review_status="approved")
        with self.assertRaises(ValueError):
            validate_row(row, require_reviewed=True)

    def test_imported_source_rows_rejected(self):
        row = fixture()
        row["source_utterance_used"] = True
        with self.assertRaises(ValueError):
            validate_row(row)

    def test_invalid_request_and_empty_content_rejected(self):
        for text in ("", "x" * 281):
            row = fixture()
            row["messages"][1]["content"] = json.dumps({"capability": "assisted_start", "description": text})
            with self.assertRaises(ValueError):
                validate_row(row)

    def test_family_leakage_rejected(self):
        first, second = fixture(), fixture()
        second.update(scenario_id="test-2", scenario_group_id="scenario-2", split="test")
        second["messages"][1]["content"] = json.dumps({"capability": "assisted_start", "description": "Another task"})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "rows.jsonl"
            path.write_text("\n".join(json.dumps(row) for row in (first, second)), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "group crosses splits"):
                validate_file(path)

    def test_split_order_independent_and_frozen_seed_enforced(self):
        import random
        families = [f"family-{i:02}" for i in range(10)]
        shuffled = families[:]
        random.Random(20261029).shuffle(shuffled)
        mapping = {family: "train" if i < 8 else "validation" if i == 8 else "test" for i, family in enumerate(shuffled)}
        rows = []
        for family in families:
            for variant in range(3):
                row = fixture()
                row.update(scenario_id=f"{family}-{variant}", split_group_id=family, split=mapping[family])
                rows.append(row)
        forward, reverse = split_rows(rows), split_rows(rows[::-1])
        self.assertEqual({k: len(v) for k, v in forward.items()}, {"train": 24, "validation": 3, "test": 3})
        self.assertEqual({k: {r["scenario_id"] for r in v} for k, v in forward.items()}, {k: {r["scenario_id"] for r in v} for k, v in reverse.items()})
        with self.assertRaises(ValueError):
            split_rows(rows, seed=9)


if __name__ == "__main__":
    unittest.main()
