# Bounded dev stability check before P3B

Date: 2026-11-03. Authorized by `accept plan dev stability + P3B`.

## Existing evidence

The previous rollout's API log recorded HTTP 503 at 14:19:51 and 14:25:12 in the host log, with request IDs `e811a8cf-0d9c-4bf4-8ee9-4cac28a4ad72` and `72e881f4-5b46-4813-bd0b-b05f307b5a06`. The first interrupted a synthetic-account cleanup read of `/auth/session`; the retained evidence does not establish the second request's path. The error filter records status/request ID, not the underlying failure, and IdentityStore converts database-operation failures into a generic ServiceUnavailableException. The root cause cannot be recovered from these logs alone.

Previous inspection found no PostgreSQL statement-timeout, deadlock or connection-exhaustion markers in the relevant interval. This does not exclude client-side timeouts or transient resource contention. Existing configuration has a five-connection pool and 3000ms database timeout; neither was changed.

## Isolated reproduction

The existing API at localhost:8081 was left unchanged. The dev web port 5173 was closed before work. Diagnostics used a disposable PostgreSQL 17 container `pyneath-p3b-test` on localhost:5544, the existing built API in a managed tool session on localhost:8082, and a temporary Vite configuration on localhost:5174. Existing migrations were applied only to the fresh test database. Assistance stayed disabled. No product backend, `.env`, timeout, retry or rate-limit changes were made.

A detached API launch was rejected by automatic review with `blocked by policy`. A foreground, tool-managed local API session was accepted and used instead. The initial migration attempt occurred before PostgreSQL was ready; after `pg_isready` succeeded, the fresh-database migration completed.

The test registered a synthetic account, prepared its profile, created a Camp and completed a Solo session. Headless Edge used the actual API/database and actual Return renderer, with no mocked HTTP responses. Four protected reads (`/auth/session`, `/me/return`, `/me/memory/personal`, `/me/memory/camps`) were exercised concurrently in bounded groups, first with a static scene and then with 3D running. Three actual logins followed. The synthetic account was deleted through the reauthenticated API afterward; the disposable database is removed at the end of P3B validation.

| Mode | Measured requests | Status | Observed maximum / sample p95 |
| --- | --- | --- | --- |
| Static scene | 12 | All 200 | 59ms |
| 3D scene | 12 | All 200 | 125ms |
| Login | 3 | All 200 | 2706ms |

These tiny local samples describe this run only; they are not latency SLOs, production-load results or physical-device GPU measurements. Login includes password verification and must not be interpreted as database-query latency.

An earlier, larger burst hit the existing identity limit of 20 requests per IP per 60 seconds and correctly returned 429, not 503. The bounded run was reduced to respect that policy; no limit was increased or bypassed. Redacted endpoint/status/duration/request-ID evidence is retained in ignored `.openai/p3b-validation/stability.json` and `stability-rate-limited.json`; the script is `.openai/p3b-stability.cjs`. No response bodies, credentials or private text are retained there.

## Decision

The two previous 503s were not reproduced in this bounded check. No repeated failure blocked the core flow, so P3B frontend implementation proceeded under the approved plan. The original cause remains unknown. If 503 recurs, correlate its request ID and add narrowly reviewed, redacted operation/error-category diagnostics before proposing a fix; do not assume increasing a timeout resolves it.
