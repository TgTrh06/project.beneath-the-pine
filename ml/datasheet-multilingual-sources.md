# Datasheet — multilingual source research for Beneath Pine AI

- **Status:** source policy with local-only synthetic artifact
- **Version:** 0.2
- **Last updated:** 2026-08-27
- **Owner:** Beneath Pine AI dataset owner
- **Scope:** source research supporting only `brain_dump` and `help_me_start`

## 1. Purpose

This datasheet records the external research sources used to design a private,
reviewed Vietnamese scenario set for the MVP. It is not a dataset manifest and it
does not authorize importing source records into training.

The model must turn a short, potentially messy description into either:

- a bounded candidate-item list plus clarification where appropriate
  (`brain_dump`); or
- one specific, non-judgmental next action of ten minutes or less, plus a smaller
  alternative (`help_me_start`).

It must not diagnose, set an unsupported deadline, change a user commitment, or
act as a general-purpose emotional-support or medical assistant.

## 2. Dataset to be produced

| Field | Target |
| --- | --- |
| Language of released training examples | Vietnamese |
| Storage | `ml/data/private/` only; never committed |
| Reviewed production target | 600 scenarios |
| Brain Dump | 300 scenarios |
| Help Me Start | 220 scenarios |
| Safety/adversarial | 80 scenarios |
| Split | deterministic 70/15/15 by `scenario_id` |
| Base model/run | `Qwen/Qwen2.5-1.5B-Instruct`, QLoRA v1 |

Each scenario has a stable `scenario_id`, capability, difficulty, safety tags,
and one user/assistant message pair. The checked-in validator is the authoritative
minimum schema check; product output contracts remain authoritative for content.

### Local synthetic artifact v0

`local-synthetic-v0` is a separate 600-scenario private artifact for pipeline and
local-model experiments. It contains 300 core Brain Dump scenarios, 220 core Help
Me Start scenarios, and 80 safety/adversarial scenarios; safety rows are assigned
to one of the two capabilities, resulting in 340 `brain_dump` and 260
`help_me_start` rows. Every row is marked `synthetic_draft_rewritten` and
`draft/local-only`.

It is not a reviewed dataset, must not be used to release or deploy an adapter,
and requires owner review and substantive rewrite before any row can enter the
production dataset.

## 3. Data policy and provenance boundary

The project's dataset governance takes precedence over all external licenses.
Accordingly, **no record, utterance, translation, paraphrase, identifier, or
substantial text from an external corpus may enter the private training JSONL**.
Licensing an external corpus does not override this rule.

External datasets may be used only as *research references* to identify abstract
coverage dimensions (for example: correction, ambiguity, multiple intents,
clarification, or small-step planning). Authors then create a new fictional
Vietnamese scenario from the abstract dimension; a Vietnamese reviewer must
substantively rewrite and approve it. Do not retain source text in prompts,
drafts, reviewer notes, or training metadata.

Every approved row must instead be attributable to one of:

- `owned_fictional_authoring` — newly authored fictional situation;
- `consented_contributor` — contributor has explicitly consented to this use and
  the text is de-identified before review; or
- `synthetic_draft_rewritten` — a generated draft substantially rewritten and
  approved by the dataset owner.

## 4. External-source register

The sources below are appropriate for desk research only under the boundary in
section 3. License status was checked on the linked official repository or dataset
card on 2026-08-26; re-check it and pin a revision before any future use.

| Source | Languages | Useful coverage dimension | Reported license | Internal decision |
| --- | --- | --- | --- | --- |
| [Multi3WOZ](https://github.com/cambridgeltl/multi3woz) | Arabic, English, French, Turkish | culturally adapted multi-domain goals; intent/slot separation | MIT | Research reference |
| [BiToD](https://github.com/HLTCHKUST/BiToD) | English, Chinese | cross-lingual multi-domain goals, dialogue states and actions | Apache-2.0 | Research reference |
| [Taskmaster](https://github.com/google-research-datasets/Taskmaster) | English | everyday task framing, clarification, next-step sequencing | CC BY 4.0 | Research reference; retain required attribution in source register only |
| [ABCD](https://github.com/asappresearch/abcd) | English | action sequences and policy-aware next steps | MIT | Research reference |
| [MultiWOZ 2.2](https://huggingface.co/datasets/pfb30/multi_woz_v22) | English | multiple intents and structured extraction | Apache-2.0 | Research reference |
| [OpenAssistant OASST1](https://huggingface.co/datasets/OpenAssistant/oasst1) | 35 languages | concise instruction-response style and quality filtering | Apache-2.0 | Research reference; no raw conversational text |
| [TEA-Dialog](https://huggingface.co/datasets/XingYuSSS/TEA-Dialog) | English | safety evaluation prompts and gentle wording failure modes | MIT | Evaluation/reference only; never train a coaching persona |
| [PRESTO](https://research.google/blog/presto-a-multilingual-dataset-for-parsing-realistic-task-oriented-dialogues/) | six languages | revisions, disfluency and code-switching | License not yet verified | Do not use until official release terms and revision are recorded |
| [Multilingual Task-Oriented Dialog](https://huggingface.co/datasets/edmdias/multilingual-task-oriented-dialog) | English, Spanish, Thai | intent and slot coverage | CC BY-SA | Do not use unless legal review accepts share-alike obligations |

### Explicit exclusions

Do not use the following as training material, translated training material, or
scenario text: raw beta/user content, private messages, scraped social posts,
unlicensed corpora, medical or therapy transcripts, and any dataset with
non-commercial or research-only restrictions. Examples include EmpatheticDialogues,
DailyDialog, DialogSum, and ESConv.

## 5. Coverage plan

| Capability | Coverage dimensions | Target |
| --- | --- | --- |
| Brain Dump | one/many items; vague vs explicit verbs; competing priorities; date uncertainty; interruption; correction; clarification; Vietnamese informal writing | 300 |
| Help Me Start | task size; low time/energy; setup friction; avoidance; smallest reversible action; user offers context; optional smaller alternative | 220 |
| Safety/adversarial | self-harm or medical cues; coercive/illegal requests; impossible deadlines; harassment; prompt injection; conflicting user constraints | 80 |

Balance difficulty across easy, moderate, and hard cases. Each scenario is
fictional and should cover work, study, home, administration, relationships, and
personal projects without using a real person's situation.

## 6. Authoring and review workflow

1. Select an abstract coverage dimension, not a source utterance.
2. Author a new fictional Vietnamese input with no direct identifier or sensitive
   personal detail.
3. Draft the JSON output against the shared output contract.
4. A Vietnamese reviewer rewrites the full scenario and target response; synthetic
   text remains only a draft until this review completes.
5. Label capability, difficulty, safety tags, and provenance class. Record author
   and reviewer IDs in a private review log, not the JSONL.
6. Run `python ml/scripts/validate_dataset.py <private-jsonl>` without printing
   scenario content. Record only version, counts, and SHA-256 in the dataset card.
7. Generate deterministic splits by `scenario_id`; freeze the holdout before
   training and do not move it into training.

## 7. Acceptance checklist

- [ ] The scenario is newly authored or has documented consent.
- [ ] No source text, translation, identifiable information, beta content, or
      unlicensed content is present.
- [ ] Vietnamese wording is natural, short, and non-judgmental.
- [ ] Brain Dump output never creates a task without confirmation.
- [ ] Help Me Start has exactly one concrete next action, no more than ten minutes,
      and a smaller option.
- [ ] The target contains no diagnosis, moralizing, invented deadline, or
      unsupported ability assumption.
- [ ] Safety cues invoke the shared safe-output behavior rather than coaching.
- [ ] JSON schema, capability, difficulty, safety tags, and `scenario_id` validate.

## 8. Private provenance manifest

Maintain this manifest separately from the JSONL and do not commit it if it can
identify contributors. One record per approved scenario is sufficient:

```json
{
  "scenario_id": "hms-v1-0042",
  "dataset_version": "v1.0",
  "provenance_class": "owned_fictional_authoring",
  "coverage_dimensions": ["setup_friction", "smallest_reversible_action"],
  "external_source_reference": null,
  "author_id": "private-author-id",
  "reviewer_id": "private-reviewer-id",
  "reviewed_at": "2026-08-26",
  "approval": "approved"
}
```

`external_source_reference` may name a source from section 4 only when it records
the abstract coverage dimension used for research. It must not contain a source
record ID, copied text, or a link to an individual source example.

## 9. Versioning and release

Any change to the private dataset requires a new dataset version, changelog,
baseline evaluation, and safety evaluation. Publish only the aggregate count,
SHA-256, code/configuration, and the model card. Keep training data, source
research notes containing text, contributor records, and pilot data private.
