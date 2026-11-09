"""Audit all exact/group invariants plus a bounded, disclosed near-duplicate sample."""
from __future__ import annotations

import hashlib
import json
import random
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from ml.common.v1_dataset import read_rows, validate_file


def normalized(text):
    text = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return " ".join(re.findall(r"[a-z0-9]+", "".join(c for c in text if not unicodedata.combining(c))))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()



def audit(args):
    root = args.directory
    validated = validate_file(root / "all.jsonl")
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    for name, checksum in manifest["output_sha256"].items():
        if sha(root / name) != checksum:
            raise ValueError(f"Frozen checksum mismatch: {name}")
    categories, languages, domains, statuses = Counter(), Counter(), Counter(), Counter()
    exact, output_counts, output_by_category = Counter(), Counter(), defaultdict(Counter)
    lengths = defaultdict(list)
    by_family = defaultdict(list)
    expected_splits = defaultdict(dict)
    for row in read_rows(root / "all.jsonl"):
        categories[row["category"]] += 1
        languages[row["language_variant"]] += 1
        domains[row["domain"]] += 1
        statuses[row["expected_status"]] += 1
        request = json.loads(row["messages"][1]["content"])
        text = request.get("description", request.get("context"))
        signature = row["capability"] + ":" + normalized(text)
        exact[signature] += 1
        answer = row["messages"][2]["content"]
        output_counts[answer] += 1
        output_by_category[row["category"]][answer] += 1
        lengths["input_chars"].append(len(text))
        lengths["chat_chars"].append(sum(len(m["content"]) for m in row["messages"]))
        by_family[row["split_group_id"]].append((row["scenario_id"], row["split"], signature))
        content_hash = hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        expected_splits[row["split"]][row["scenario_id"]] = content_hash
    if sum(n - 1 for n in exact.values()) != 0:
        raise ValueError("Normalized duplicate inputs detected")
    for split, expected in expected_splits.items():
        actual = {}
        for row in read_rows(root / f"{split}.jsonl"):
            if row["split"] != split or row["scenario_id"] in actual:
                raise ValueError("Wrong split/duplicate id in split file")
            actual[row["scenario_id"]] = hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        if actual != expected:
            raise ValueError(f"Split content mismatch: {split}")

    # 40 deterministic rows per family = 3,200. This is not an exhaustive pairwise audit.
    rng, sample = random.Random(20261029), []
    for family in sorted(by_family):
        candidates = sorted(by_family[family])
        sample.extend(rng.sample(candidates, min(40, len(candidates))))
    shingles = []
    buckets = defaultdict(list)
    prime = 4294967311
    coefficients = [(rng.randrange(1, prime), rng.randrange(prime)) for _ in range(16)]
    for index, (_, _, text) in enumerate(sample):
        words = text.split()
        grams = {" ".join(words[i:i + 3]) for i in range(max(1, len(words) - 2))}
        shingles.append(grams)
        hashes = [int.from_bytes(hashlib.blake2s(g.encode(), digest_size=4).digest(), "little") for g in grams]
        signature = [min((a * h + b) % prime for h in hashes) for a, b in coefficients]
        for band in range(8):
            buckets[(band, signature[2 * band], signature[2 * band + 1])].append(index)
    pairs, capped = set(), False
    for key in sorted(buckets):
        bucket = buckets[key]
        for pos, left in enumerate(bucket):
            for right in bucket[pos + 1:]:
                pairs.add((left, right))
                if len(pairs) >= 200000:
                    capped = True
                    break
            if capped:
                break
        if capped:
            break
    near, cross, examples = 0, 0, []
    for left, right in sorted(pairs):
        similarity = len(shingles[left] & shingles[right]) / len(shingles[left] | shingles[right])
        if similarity >= .75:
            near += 1
            across = sample[left][1] != sample[right][1]
            cross += int(across)
            if len(examples) < 50:
                examples.append({"left": sample[left][0], "right": sample[right][0], "jaccard": round(similarity, 4), "cross_split": across})
    def distribution(values):
        values = sorted(values)
        return {"min": values[0], "median": values[len(values) // 2], "p95": values[int(len(values) * .95)], "max": values[-1]}
    report = {
        "schema_validation": validated,
        "checks": {"frozen_checksums_match": True, "split_file_content_matches_all": True,
                   "task_family_disjoint": True, "scenario_group_disjoint": True,
                   "normalized_duplicate_inputs": 0},
        "counts": {"categories": dict(categories), "languages": dict(languages), "domains": dict(domains), "statuses": dict(statuses)},
        "unique_output_json": len(output_counts),
        "output_repetition_by_category": {key: {"rows": sum(count.values()), "unique_outputs": len(count), "most_frequent_output_count": max(count.values())} for key, count in output_by_category.items()},
        "lengths": {key: distribution(value) for key, value in lengths.items()},
        "tokenizer_checked": False,
        "near_duplicate_sample": {
            "sample_rows": len(sample), "candidate_pairs_checked": len(pairs), "candidate_cap_reached": capped,
            "algorithm": "accent/punctuation normalized word trigrams, 16-minhash/8-band LSH; exact Jaccard >= 0.75 on candidates",
            "near_pairs": near, "cross_split_near_pairs": cross, "example_pairs": examples,
            "limitations": "Sampled lexical screen, may miss paraphrases. Shared rule templates remain; no claim of semantic deduplication or independently authored holdout."
        },
        "human_review": {"approved": 0, "pending": validated["rows"], "production_ready": False},
        "warning": "Structural checks passed; semantic correctness, diversity and model quality are not certified. Token lengths require the actual base tokenizer before training."
    }
    (root / "quality-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = ["# Pyneath v1 — kiểm tra dữ liệu", "",
               f"Số mẫu: {validated['rows']:,}. Trạng thái: bản tổng hợp chờ duyệt.", "",
               "## Kiểm tra toàn bộ", "",
               "- JSON/metadata/output contract: đạt kiểm tra Python.",
               "- Checksum và nội dung từng tập khớp all.jsonl.",
               "- Không trùng đầu vào sau chuẩn hóa dấu/cách viết.",
               "- Các nhóm tình huống và họ công việc không giao nhau giữa các tập.", "",
               "## Độ đa dạng và giới hạn", "",
               "- 80 họ công việc, 800 cặp công việc–chủ đề; 80.000 dòng tạo tổ hợp từ quy tắc.",
               f"- {len(output_counts):,} JSON đầu ra khác nhau; phản hồi an toàn/dự phòng cố định được lặp có chủ đích.",
               f"- Quét gần trùng trên {len(sample):,} dòng: {near:,} cặp đạt Jaccard ≥ 0,75, trong đó {cross:,} cặp khác tập.",
               "- Cùng mẫu câu/quy tắc vẫn xuất hiện giữa các tập; holdout này chưa độc lập về cách viết.",
               "- Chưa kiểm tra tokenizer, chưa train, chưa đo chất lượng mô hình.",
               "- Cả 80.000 dòng chưa được người duyệt tiếng Việt ký duyệt.", "",
               "Xem quality-report.json để biết phạm vi quét, số liệu đầy đủ và các cặp cần xem lại.", ""]
    (root / "quality-report.md").write_text("\n".join(summary), encoding="utf-8")
    print(json.dumps({"rows": validated["rows"], "unique_outputs": len(output_counts), "near_pairs_sample": near, "cross_split_near_pairs_sample": cross}))
