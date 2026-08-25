# Local Inference Architecture

## Boundary

`apps/api` is the only caller of `apps/inference`. The browser never receives the inference URL or token.

```text
React web → Fastify API → bearer-authenticated inference service → local GGUF + adapter
                         ↘ manual fallback when unavailable
```

## Runtime configuration

- `AI_PROVIDER=manual_fallback|beneath_pine|openai`
- `INFERENCE_SERVICE_URL`
- `INFERENCE_SERVICE_TOKEN`
- `INFERENCE_TIMEOUT_MS`
- `BENEATH_PINE_GGUF_PATH` and `BENEATH_PINE_MODEL_VERSION` are local inference-only.

`beneath_pine` retries one malformed response then returns deterministic guidance. No provider exception, prompt, raw output or bearer token is logged.

## Pilot deployment

Run FastAPI and the 4-bit GGUF on the presentation laptop. During scheduled pilot sessions, expose only the inference service through a temporary HTTPS tunnel with the service token. Rehearse the offline flow before every session; manual fallback is the rollback path.
