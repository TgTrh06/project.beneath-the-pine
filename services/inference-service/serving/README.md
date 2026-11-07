# Local llama-server runtime

This directory is separate from the legacy FastAPI `app/`. No FastAPI process is required for the new local provider. Nothing is enabled or deployed by adding these files.

Build llama-server and llama-quantize from the same clean, immutable llama.cpp revision used for export. Record binary hashes and `--help`/version output in the hardware report. The launcher requires a model manifest and an explicit binary SHA-256; it does not download binaries or models.

```sh
# Provide PYNEATH_INFERENCE_TOKEN via the process environment/secret manager.
python services/inference-service/serving/serve.py --binary PATH_TO_LLAMA_SERVER --binary-sha256 SHA256 --model PATH_TO_REVIEWED_GGUF --artifact PATH_TO_ARTIFACT_JSON --model-id pyneath-v2-RUN-QUANT --gpu-layers 0
```

The process binds to `127.0.0.1:8011`, uses `LLAMA_API_KEY`, disables request logging, reserves 4,096 context tokens across two slots (2,048 each), and caps generation at 512 tokens. CPU is the initial explicit launcher default; change GPU layers only in the recorded hardware benchmark. Verify the pinned server recognizes these flags and environment settings before connecting NestJS. Missing/wrong-token calls must fail. `/health` is used only for local model readiness; it is not the product database readiness check.

The model stays loaded for repeated requests. The product calls only the configured origin, rejects redirects, caps response size at 32 KiB and aborts after six seconds. A separate GPU host requires an approved private-network/TLS deployment configuration; do not expose this listener publicly or pass the token to web configuration.

Run `python -m ml.evaluation.benchmark --help` for end-to-end fictional-request measurements against a disposable API. Set `PYNEATH_BENCH_COOKIE`, `PYNEATH_BENCH_CSRF` (from that session) and `PYNEATH_BENCH_WEB_ORIGIN` through the process environment. Keep output under `ml/artifacts/` or another private artifact directory. A server/model smoke check is not deployment authorization. Retain the previous model and its checksums for rollback.
