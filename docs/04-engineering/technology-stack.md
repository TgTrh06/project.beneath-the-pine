# Technology Stack

- **Status:** Approved private-beta implementation
- **Version:** 3.0
- **Last updated:** 2026-08-09

## Decision

Beneath the Pine is a responsive Vietnamese **web** private beta. Mobile devices are supported through a mobile-first React interface; native Android/iOS apps are explicitly deferred. Desktop packaging is out of scope.

## Official stack

| Layer | Technology | Purpose |
|---|---|---|
| Web app | React 19 + Vite + TypeScript | Responsive client application |
| API | Node.js + Fastify + TypeScript | REST API, authorization and AI orchestration |
| Validation | Zod | Shared API, input and AI-output contracts |
| Auth | Supabase Auth | Magic link / OTP sessions |
| Database | Supabase Postgres | Product data and access control |
| ORM | Drizzle ORM + Drizzle Kit | Schema, migrations and typed persistence |
| AI | OpenAI Responses API | Structured Brain Dump, Help Me Start and Weekly Review outputs |
| Testing | Vitest | Unit, API-composition and contract tests |
| Web deploy | Vercel | Temporary beta URL and static web hosting |
| API/jobs deploy | Render | API process and scheduled maintenance jobs |

## Source shape

```text
project.beneath-the-pine/
├── apps/
│   ├── web/                  # React + Vite client
│   └── api/                  # Fastify API and scheduled jobs
├── packages/
│   └── contracts/            # Shared Zod API and AI schemas
├── supabase/
│   └── migrations/           # Versioned database migrations and RLS
├── docs/
├── .github/workflows/        # CI
├── pnpm-workspace.yaml
├── render.yaml
└── vercel.json
```

## Dependency rules

```text
React web app → REST API → application use cases → Drizzle → Supabase Postgres
                         └→ OpenAI → structured-output validation
```

- The web application never calls OpenAI or PostgreSQL directly.
- The API validates user access and beta membership before private actions.
- AI output cannot create or modify a task until the user explicitly confirms it.
- Analytics contains IDs, enums and durations only—never raw Brain Dump or Check-in text.
- Sensitive free-text fields are encrypted before storage and raw Brain Dump content is purged after 30 days.

## Explicit exclusions

- Expo, React Native, native Android/iOS applications and desktop packaging.
- Next.js, Electron, Tauri and a second web framework.
- MongoDB, GraphQL, microservices, Kafka and Kubernetes.
- Payments, calendar sync, notifications, complex goals and gamification during beta.

## Next technical milestones

1. Configure Supabase local and apply migrations.
2. Set web/API environment variables and test the authenticated flow.
3. Create a Supabase Cloud project and deploy web/API to the beta environments.
4. Configure OpenAI project spending alerts and production SMTP before inviting beta users.
