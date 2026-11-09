"""Build the private, compositional Pyneath v1 draft; no network or model calls.

Authoring banks must be supplied separately and stay outside Git. Existing output
files are never overwritten. Technical validation is not human approval.
"""
from __future__ import annotations

import csv
import hashlib
import json
import random
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

VERSION = "pyneath-assistance-vi-v1"
SEED = 20261029


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def unaccent(text):
    return "".join(c for c in unicodedata.normalize("NFD", text.replace("đ", "d").replace("Đ", "D")) if not unicodedata.combining(c))


def render_language(text, index):
    # Orthographic variants replace a row; they never expand its count.
    if index % 20 == 0:
        return unaccent(text), "vi_unaccented"
    if index % 20 == 1:
        changed = text.replace("chưa", "chua").replace("không", "ko")
        return changed, "vi_informal" if changed != text else "vi"
    if index % 20 == 2:
        changed = text.replace("bản nháp", "draft").replace("ghi chú", "note")
        return changed, "vi_mixed" if changed != text else "vi"
    return text, "vi"


def base_output(capability):
    return {"capability": capability, "version": "1", "needsHumanSupport": False, "fallback": "manual_step"}


def suggestion(capability, action, minutes=5):
    output = base_output(capability)
    if capability == "assisted_start":
        output.update(activationStep=action, estimatedMinutes=minutes)
    else:
        output["openSeedDraft"] = action
    return output



def generate(args):
    with (args.authoring / "catalog.tsv").open(encoding="utf-8", newline="") as handle:
        catalog = list(csv.DictReader(handle, delimiter="\t"))
    recipes = json.loads((args.authoring / "recipes.json").read_text(encoding="utf-8"))
    policy = json.loads((args.authoring / "policy.json").read_text(encoding="utf-8"))
    if len(catalog) != 80 or len({x["family"] for x in catalog}) != 80:
        raise ValueError("Expected 80 unique task families")
    domains = defaultdict(list)
    for item in catalog:
        targets = item["targets"].split("|")
        if len(targets) != 10 or len(set(targets)) != 10 or len(recipes[item["domain"]]) != 6:
            raise ValueError("Expected ten targets and six work stages per family")
        domains[item["domain"]].append(item["family"])
    if len(domains) != 8 or any(len(v) != 10 for v in domains.values()):
        raise ValueError("Expected eight domains of ten families")
    split_map = {}
    rng = random.Random(SEED)
    for domain in sorted(domains):
        families = sorted(domains[domain])
        rng.shuffle(families)
        for index, family in enumerate(families):
            split_map[family] = "train" if index < 8 else "validation" if index == 8 else "test"

    rows = []

    def add(item, target, target_index, category, variant, capability, text, output, tags, expected, difficulty="moderate"):
        language_index = int(hashlib.sha256(f"{item['family']}/{target_index}/{variant}".encode()).hexdigest()[:8], 16)
        text, language = render_language(text, language_index)
        request_key = "description" if capability == "assisted_start" else "context"
        row_id = f"pvi1-{item['family']}-{target_index:02d}-{variant}"
        rows.append({
            "scenario_id": row_id, "scenario_group_id": f"{item['family']}-{target_index:02d}",
            "split_group_id": item["family"], "split": split_map[item["family"]],
            "dataset_version": VERSION, "capability": capability, "domain": item["domain"],
            "category": category, "difficulty": difficulty, "safety_tags": tags,
            "provenance_class": "synthetic_draft_rewritten", "provenance_stage": "unreviewed_synthetic_draft",
            "authoring_method": "codex_authored_rules_and_private_catalog", "review_status": "pending_review",
            "reviewer_id": None, "reviewed_at": None, "usage": "draft/local-only",
            "license_status": "private_owner_release_decision_pending", "language_variant": language,
            "template_id": f"{item['domain']}/{variant}", "expected_status": expected,
            "generation_seed": SEED, "source_utterance_used": False,
            "messages": [
                {"role": "system", "content": policy["system"]},
                {"role": "user", "content": compact({"capability": capability, request_key: text})},
                {"role": "assistant", "content": compact(output)}
            ]
        })

    for item in catalog:
        for ti, target in enumerate(item["targets"].split("|")):
            values = dict(item, target=target)
            phases = [[part.format(**values) for part in phase] for phase in recipes[item["domain"]]]
            prefix = f"Mình {item['work']}, phần {target}."
            for stage, (state, action, tiny) in enumerate(phases):
                # Eight different constraints affect the target action, not just its wording.
                modes = [
                    ("Chỉ còn 3 phút, cần bước nhỏ nhất.", f"Trong 3 phút, {tiny}.", 3, "short_time"),
                    ("Có 5 phút và công cụ đang sẵn.", f"Dành 5 phút để {action}.", 5, "ready"),
                    ("Sợ làm sai nên chỉ muốn thử trên bản nháp riêng.", f"Trên bản nháp riêng, {tiny}; chưa cần sửa bản đang dùng.", 3, "reversible"),
                    ("Chưa muốn thay đổi gì, chỉ xem trước.", f"Ghi vào giấy một dòng mô tả cách bạn sẽ {action}, chưa thực hiện thay đổi.", 5, "preview_only"),
                    ("Không có công cụ bên cạnh, chỉ có giấy và bút.", f"Trên giấy, viết một dòng nhắc bước sẽ làm khi có công cụ: {action}.", 3, "paper_only"),
                    ("Dễ bị ngắt giữa chừng, cần ghi lại điểm dừng.", f"{action[0].upper() + action[1:]}, để lại một dấu ở điểm dừng nếu bị ngắt.", 5, "interruption"),
                    ("Hơi mệt, chỉ muốn làm một thao tác rất nhẹ.", f"Chỉ {tiny}; có thể dừng ở đó sau 3 phút.", 3, "low_energy"),
                    ("Có 10 phút, muốn thử một bước rồi tự xem lại.", f"Dành tối đa 10 phút để {action}, dừng ở một phần nhỏ có thể tự xem lại.", 10, "bounded_trial")
                ]
                if item["domain"] == "home":
                    modes[2] = ("Chỉ muốn thử tạm, chưa muốn chuyển đồ cố định.", f"{tiny[0].upper() + tiny[1:]}, coi đây là lựa chọn tạm và chưa đổi chỗ cố định.", 3, "reversible")
                for mi, (constraint, answer, minutes, tag) in enumerate(modes):
                    add(item, target, ti, "assisted_start", f"start-{stage}-{mi}", "assisted_start",
                        f"{prefix} {state} {constraint}", suggestion("assisted_start", answer, minutes), [tag], "suggestion")

            # The user supplies the actual next step. Extract it without inventing progress.
            for stage in range(4):
                state, action, tiny = phases[stage]
                seed_modes = [
                    (f"Chưa làm bước này: {action}.", f"Lần tới, {action}.", "next_action"),
                    (f"Điểm dừng đã ghi. Lần tới chỉ muốn: {tiny}.", f"Lần tới, chỉ {tiny}.", "smaller_return"),
                    (f"Đã ghi chỗ đang dở. Bước tiếp theo: {action}. Đợi có công cụ mới làm.", f"Khi có công cụ, {action}.", "tool_dependency"),
                    (f"Chưa muốn thay đổi hiện trạng; lần tới ghi trên giấy cách sẽ {action}.", f"Lần tới, ghi trên giấy cách sẽ {action}, chưa thay đổi hiện trạng.", "preserve_draft"),
                    (f"Đã đánh dấu phần này. Lần tới có 3 phút, chỉ làm: {tiny}.", f"Lần tới, dành 3 phút để {tiny}.", "time_bound_return"),
                    (f"Vừa dừng giữa chừng. Muốn bỏ bước lớn để thử: {tiny}.", f"Quay lại bằng bước nhỏ: {tiny}.", "user_correction"),
                    (f"Đã ghi việc tiếp theo là {action}. Nếu thiếu sức thì nghỉ, để lần khác.", f"Khi sẵn sàng quay lại, {action}.", "optional_return"),
                    (f"Đã chốt bước tới: {action}. Chỉ cần câu nhắc, đừng thêm việc.", f"Tiếp tục với một bước: {action}.", "no_added_tasks")
                ]
                for mi, (checkout, answer, tag) in enumerate(seed_modes):
                    add(item, target, ti, "open_seed_draft", f"seed-{stage}-{mi}", "open_seed_draft",
                        f"{prefix} {state} {checkout}", suggestion("open_seed_draft", answer), [tag], "suggestion")

            for ci, case in enumerate(policy["challenges"]):
                capability = "assisted_start" if ci % 2 == 0 else "open_seed_draft"
                text = f"{prefix} {case['input']}"
                if case["response"] == "fallback":
                    output = dict(base_output(capability), message=policy["fallback"])
                    status = "fallback"
                else:
                    # Benign negative / ignorable injection with a complete ordinary task.
                    action = phases[0][1]
                    if capability == "assisted_start":
                        text += " Chưa bắt đầu phần này."
                        output = suggestion(capability, f"Dành 5 phút để {action}.")
                    else:
                        text += f" Việc tiếp theo mình chọn: {action}."
                        output = suggestion(capability, f"Lần tới, {action}.")
                    status = "suggestion"
                add(item, target, ti, "challenge", f"edge-{ci}", capability, text, output, [case["tag"]], status, "hard")

            for bi, case in enumerate(policy["boundaries"]):
                capability = "assisted_start" if bi % 2 == 0 else "open_seed_draft"
                output = dict(base_output(capability), needsHumanSupport=True,
                              message=policy["boundary"], fallback="stop_and_return")
                add(item, target, ti, "safety_boundary", f"boundary-{bi}", capability,
                    f"{prefix} {case['input']}", output, [case["tag"]], "boundary", "hard")

    if Counter(row["category"] for row in rows) != {"assisted_start": 38400, "open_seed_draft": 25600, "challenge": 9600, "safety_boundary": 6400}:
        raise ValueError("Unexpected composition")
    # The schema validator is independent of generation templates.
    from ml.common.v1_dataset import validate_row
    for row in rows:
        validate_row(row)
    paths = [args.output / name for name in ["all.jsonl", "train.jsonl", "validation.jsonl", "test.jsonl", "review-sample.jsonl", "review-sample.md", "manifest.json"]]
    if any(path.exists() for path in paths):
        raise FileExistsError("Use a new output directory/version; frozen files are never overwritten")
    args.output.mkdir(parents=True, exist_ok=True)
    rng.shuffle(rows)
    for path in paths[:4]:
        selection = rows if path.stem == "all" else [row for row in rows if row["split"] == path.stem]
        with path.open("x", encoding="utf-8", newline="\n") as handle:
            for row in selection:
                handle.write(compact(row) + "\n")
    # One row per domain/template/status (800 rows) spread across all three splits.
    samples = {}
    for row in rows:
        key = (row["domain"], row["category"], row["template_id"].split("/", 1)[1])
        samples.setdefault(key, row)
    sample_rows = sorted(samples.values(), key=lambda x: x["scenario_id"])
    paths[4].write_text("".join(compact(row) + "\n" for row in sample_rows), encoding="utf-8")
    review_text = ["# Pyneath v1 — mẫu để duyệt", "", "DRAFT — chưa có người duyệt. Không sửa tập test để tối ưu mô hình sau khi train.", ""]
    for row in sample_rows:
        review_text += [f"## {row['scenario_id']} ({row['split']}, {row['category']})", "", row["messages"][1]["content"], "", "```json", json.dumps(json.loads(row["messages"][2]["content"]), ensure_ascii=False, indent=2), "```", ""]
    paths[5].write_text("\n".join(review_text), encoding="utf-8")
    manifest = {
        "dataset_version": VERSION, "seed": SEED, "rows": len(rows), "status": "unreviewed_synthetic_draft",
        "reviewed_rows": 0, "independently_human_authored_holdout": False,
        "task_families": 80, "task_target_groups": 800, "rows_per_task_family": 1000,
        "source_policy": "External dataset cards inform abstract coverage only; zero imported, translated or paraphrased source rows.",
        "provenance_note": "synthetic_draft_rewritten is a planned governance class, not a claim that Vietnamese reviewer rewriting or approval has occurred.",
        "license": "Private authoring; owner release decision pending. No public redistribution license granted.",
        "source_register": "source-register.json",
        "split_policy": "SHA-recorded deterministic assignment, 8/1/1 task families per domain; shared templates remain across splits.",
        "split_groups": split_map,
        "split_counts": dict(Counter(x["split"] for x in rows)),
        "category_counts": dict(Counter(x["category"] for x in rows)),
        "capability_counts": dict(Counter(x["capability"] for x in rows)),
        "authoring_sha256": {path.name: digest(path) for path in sorted(args.authoring.iterdir()) if path.is_file()},
        "generator_sha256": digest(__file__),
        "output_sha256": {path.name: digest(path) for path in paths[:6]},
        "limitations": [
            "80,000 compositional rows, not 80,000 independently authored situations.",
            "Only 80 task families, 800 task-target combinations and shared rule templates; lexical diversity overstates semantic diversity.",
            "Safety and adversarial scenarios have a small template base; this is not a safety benchmark.",
            "Shared templates across splits make results optimistic; use a separately human-authored holdout before release.",
            "No model training, measured model quality, clinical validation or human sign-off.",
            "Current service uses a cue filter and provider-specific output; this full AssistanceOutput training target is not a drop-in served model."
        ]
    }
    paths[6].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(compact({"rows": len(rows), "splits": manifest["split_counts"], "review_sample": len(sample_rows)}))
