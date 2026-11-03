# Python dependency follow-up — 2026-11-02

Status: open follow-up; inference service and ML data/code were not modified.

`pip-audit 2.10.1` ran in a disposable virtualenv, against a frozen list from `services/inference-service/.venv` (`pip freeze --exclude-editable`). It scanned 27 installed distributions. The output contained two identical entries for one unique advisory; these are not two distinct vulnerabilities.

| Package | Installed | Advisory | Severity | Follow-up |
| --- | --- | --- | --- | --- |
| certifi | 2026.7.22 | [GHSA-6q48-6c7w-9gw2 / PYSEC-2026-4320](https://github.com/advisories/GHSA-6q48-6c7w-9gw2) | Critical (upstream rating) | Upgrade to 2026.10.19 or later in a separately approved Python maintenance change; rescan and rebuild environments/images that contain it. |

The installed dependency paths include the development HTTP client `httpx 0.28.1 → certifi` and `httpx → httpcore 1.0.9 → certifi`. The declared core FastAPI/Uvicorn service dependencies do not themselves require this HTTP client. This is an installed-environment finding, not proof that the affected CA bundle is used by production traffic.

Exploit conditions: an attacker with a compromised intermediate CA key and an on-path position can intercept TLS traffic trusting the affected certifi bundle. The upstream fix removes affected roots; 2026.10.19 restores unaffected roots. Until updated, do not use this local environment for sensitive outbound HTTPS traffic. Removing the finding requires a fresh environment scan showing a patched certifi and checking any vendored copies.

The scan did not install optional `llama-cpp-python`, scan container OS packages, assess model files, or change the existing virtualenv. The installed pytest version (9.1.1) also differs from the declared dev constraint (`<9`); reconcile the environment in the same follow-up instead of treating this freeze as a reproducible lockfile.

Evidence: [audited package list](evidence/security-2026-11-02/python-requirements-audited.txt), [deduplicated audit result](evidence/security-2026-11-02/python-audit-summary.json).
