# Beneath the Pine

> A mobile-first focus ritual for starting and returning to personal work — alone when possible, with trusted people when helpful.

Beneath the Pine is designed around a single core loop:
```text
Return Card (or new intention) → activation step → solo or private Focus Pact → honest check-out → Open Seed → return or next pact
```

Pine is **not** a task manager, public social network, or productivity game. It does not use streaks, punishment mechanics, public leaderboards, or gamified currencies. A session is valuable when a person takes one deliberate start, and a loop is valuable when they know exactly where to resume without confronting an overwhelming backlog.

---

## 🏛️ Platform & Architecture Overview

The platform is designed to be client-independent, separating business logic and persistent state from client presentation:

- **Modular Monolith Backend (`apps/api`)**: Built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Drizzle ORM**. It is the single source of truth for authorization, durable session lifecycles, and server-authoritative timestamps. It includes a **Socket.IO** gateway for real-time presence and session synchronisation.
- **Shared Contracts (`packages/contracts`)**: Pure TypeScript library containing **Zod schemas** and domain types for HTTP endpoints, event catalogs, and real-time Socket.IO projections shared across web and future mobile clients.
- **Web Validation Client (`apps/web`)**: **React 19** + **Vite** web application serving as the first pilot client to validate domain models, user rituals, and real-time contracts.
- **Target Mobile Client**: **React Native + Expo** is the intended long-term product client, sharing the same NestJS API without requiring backend architectural rewrites.
- **Experimental & Research Assets (`ml/`, `services/inference-service/`)**: Standalone local inference and fine-tuning experiments (QLoRA, GGUF) governed under ML safety standards. They are strictly decoupled and **not** a runtime dependency for the MVP product loop.

---

## 📦 Core Domain Modules (`apps/api`)

The backend is structured into clear, decoupled domain modules managed by `AppModule`:

| Module | Responsibility |
| --- | --- |
| **`identity`** | Account creation, authentication, session tokens, and security principals. |
| **`profile`** | Minimal user profile, preferences, and timezone configuration. |
| **`circle`** | Private circles between trusted peers; invite codes, membership lifecycles, and access control. |
| **`pact`** | Scheduled or immediate Focus Pacts with invite acceptance, decline, cancellation, and expiry. |
| **`focus`** | Solo and pact focus sessions, server-authoritative timer, and terminal outcome idempotency. |
| **`seed`** | Single active Open Seed management to anchor and resume unfinished work cleanly. |
| **`presence`** | Minimal, real-time presence heartbeats via Socket.IO (never exposing private work content). |
| **`memory`** | Gentle, non-competitive milestone reflections and forest representation. |
| **`privacy`** | Technical privacy baselines, exportable data bundles, and account deletion flows. |
| **`analytics`** | Redacted, allowlisted telemetry events without raw user work content. |
| **`platform/`** | Centralised configuration, security filters, and health checks (liveness/readiness). |

---

## 🚫 Product Boundaries (Out of Scope)

To preserve focus and psychological safety, the platform explicitly excludes:
- Public rooms, stranger matchmaking, public Signal, social feeds, and follower graphs.
- Voice/video calls, live streaming, or camera requirements.
- Leaderboards, streak penalties, daily quests, virtual currency, shops, or minutes-based rewards.
- Full task/project management systems, calendars, habit trackers, and medical or diagnostic claims.

---

## 🛠️ Requirements & Tooling

Ensure your local development environment meets the workspace engine specifications:

- **Node.js**: `>=22.12.0`
- **pnpm**: `10.32.1`
- **Docker**: Docker Desktop or Docker Engine (for local PostgreSQL 17)

---

## 🚀 Getting Started

### 1. Install Dependencies

```sh
pnpm install
```

### 2. Start the Local PostgreSQL Database

Launch the isolated PostgreSQL 17 container defined in `compose.local.yml`:

```sh
pnpm db:local:up
```

*The container exposes PostgreSQL on `127.0.0.1:5433` (database: `btp_review`, user: `btp_local`, password: `btp_local_password`).*

### 3. Environment Configuration

- **API Configuration**: Copy `apps/api/.env.example` to `apps/api/.env` and adjust variables as needed:
  ```sh
  cp apps/api/.env.example apps/api/.env
  ```
  Uncomment `API_DATABASE_URL` in `apps/api/.env` to connect to the local container.
- **Web Configuration**: The web client proxies `/api/v1` to `http://localhost:8081` by default via Vite. See `.env.example` if overriding `VITE_API_URL`.

### 4. Run Development Servers

Run the backend and frontend in separate terminals:

```sh
# Start NestJS Core API (http://localhost:8081)
pnpm dev:api

# Start Web Validation Client (http://localhost:5173)
pnpm dev
```

---

## 🧪 Verification & Workspace Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Start the web application dev server. |
| `pnpm dev:api` | Start the NestJS API dev server. |
| `pnpm build` | Build all workspace packages and applications. |
| `pnpm build:api` | Build the API project. |
| `pnpm lint` | Run TypeScript checking / linting across the workspace. |
| `pnpm lint:api` | Run linter on the API package. |
| `pnpm test` | Run all workspace unit and integration tests. |
| `pnpm test:api` | Run tests for the API package. |
| `pnpm db:local:up` | Start local PostgreSQL container in background. |
| `pnpm db:local:down` | Stop and remove the local PostgreSQL container. |
| `pnpm db:local:logs` | Follow logs from the local PostgreSQL container. |

---

## 📚 Documentation Map

The single source of truth for product direction, architecture, and standards lives in [`docs/`](docs/README.md):

- **[00 — Foundation](docs/00-foundation/README.md)**: [Product Direction](docs/00-foundation/product-direction.md), [MVP Scope](docs/00-foundation/mvp-scope.md), [Principles](docs/00-foundation/product-principles.md), and [Roadmap](docs/00-foundation/roadmap.md).
- **[04 — Engineering](docs/04-engineering/README.md)**: [System Architecture](docs/04-engineering/system-architecture.md), [Data Model](docs/04-engineering/data-model.md), [Core State Machines](docs/04-engineering/core-state-machines.md), [Architecture Decisions (ADRs)](docs/04-engineering/adr/README.md), and [Web/Mobile API Strategy](docs/04-engineering/web-mobile-api-strategy.md).
- **[06 — Security & Privacy](docs/06-security-privacy/README.md)**: [Privacy by Design](docs/06-security-privacy/privacy-by-design.md) and [Data Rights and Retention](docs/06-security-privacy/data-rights-and-retention.md).
- **[07 — Testing](docs/07-testing/README.md)**: Solo loop verification, pact discovery tests, and verification plans.
- **[05 — Machine Learning](docs/05-machine-learning/README.md)**: Evaluation gates and data governance for prospective Pine Assistance.
