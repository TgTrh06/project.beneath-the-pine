# Local Inference Architecture

## Boundary

`services/inference-service` is an isolated pilot provider. It has no current application caller. A future Java AI adapter/worker will be its only caller; the browser must never receive the inference URL or token.

```text
React web → future Java AI adapter/worker → bearer-authenticated inference service
                                      └──→ local GGUF + adapter
```

## Runtime configuration

- Application-side provider URL, token and timeout settings will be defined with the Java AI slice.
- `BENEATH_PINE_SERVICE_TOKEN`, `BENEATH_PINE_GGUF_PATH` and `BENEATH_PINE_MODEL_VERSION` are inference-service-only.

The eventual Java adapter must validate output and provide deterministic fallback behavior. No provider exception, prompt, raw output or bearer token may be logged.

## Pilot deployment

Run FastAPI and the 4-bit GGUF on the presentation laptop. During scheduled pilot sessions, expose only the inference service through a temporary HTTPS tunnel with the service token. Rehearse the offline flow before every session; manual fallback is the rollback path.
