# Local Synthetic Dataset Card v0

- **Status:** Legacy local pipeline fixture; not a Pine Assistance release dataset.
- **Access:** `ml/data/private/`, excluded from Git.
- **Allowed use:** validator, split, QLoRA and local inference experiments only.
- **Prohibited use:** production adapter release, deployment or pilot behavior without Pine Assistance mapping/review.

The fixture's former `brain_dump` and `help_me_start` labels belong to the previous product direction. A row may enter the Pine Assistance dataset only after it is mapped to `assisted_start`, `stuck_recovery` or `open_seed_draft`, substantially rewritten and reviewed under [Dataset Governance](../docs/05-machine-learning/dataset-governance.md).

Its historical checksums and generation scripts remain useful for reproducibility, but do not establish quality, safety or permission to serve a model.
