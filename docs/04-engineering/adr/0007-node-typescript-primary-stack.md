# ADR-0007 — Node.js and TypeScript as the Primary Application Stack

- **Status:** Superseded by [ADR-0011](0011-nestjs-drizzle-mobile-direction.md).
- **Purpose:** Concise historical record; not a current implementation guide.

The earlier decision selected a TypeScript workspace with React/Vite, a Fastify API, shared Zod contracts and Drizzle/Supabase integration.

The current choice is NestJS + Drizzle for Core and React Native + Expo for mobile. The former Fastify and identity-provider choices do not carry forward automatically. Current topology is defined by [ADR-0012](0012-modular-monolith-proposal.md).

Detailed superseded implementation discussion remains in Git history. Use the current ADRs and engineering guide for new work.
