# Technology Stack

- **Status:** Approved private-beta and graduation-project implementation
- **Last updated:** 2026-08-14

## Product runtime

| Layer | Technology | Responsibility |
|---|---|---|
| Web | React 19, Vite, TypeScript | Responsive application and pilot UI |
| API | Node.js, Fastify, TypeScript | Authenticated product API and AI provider boundary |
| Database/Auth | Supabase Postgres, Supabase Auth, Drizzle | Product data, consent, migrations and access control |
| Contracts | Zod workspace package | Shared input/output validation |
| Web deploy | Vercel | Static React build |
| API/jobs deploy | Render | Fastify API and purge job |

## Project-owned AI runtime

| Stage | Technology | Responsibility |
|---|---|---|
| Training | Google Colab, Unsloth, PEFT | Reproducible QLoRA SFT |
| Base model | Qwen2.5-1.5B-Instruct | Vietnamese-capable foundation model |
| Inference | Python FastAPI, llama.cpp, GGUF Q4 | Local model process on the pilot laptop |
| Tunnel | Temporary HTTPS tunnel + service bearer token | Scheduled pilot access only |

## Rules

- Browser code never calls the inference service or holds model secrets.
- The API can switch between `manual_fallback`, `beneath_pine` and `openai`; the pilot uses the project model or deterministic fallback only.
- Desktop/native mobile, calendar sync, payments and unrestricted chat are out of scope before defense.
