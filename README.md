# Beneath the Pine

Beneath the Pine helps Vietnamese users turn overwhelm into one small next action.

## Local development

1. Copy `.env.example` to `.env` and generate a base64 32-byte `CONTENT_ENCRYPTION_KEY`.
2. Start local Supabase with `supabase start` after installing the Supabase CLI.
3. Run `pnpm install`, then start the web and API in separate terminals with `pnpm dev` and `pnpm dev:api`.

Without configured Supabase, the web runs in an explicit local demo mode; private data is kept only in that browser. Production access always requires Supabase Auth and an active beta membership.

## Workspace

- `apps/web` — React/Vite user experience and beta admin shell
- `apps/api` — Fastify API, AI orchestration, data lifecycle jobs
- `packages/contracts` — shared runtime schemas and API types
- `supabase` — local config, schema migrations and seed instructions
