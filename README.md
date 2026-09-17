# Beneath the Pine

> A mobile-first focus ritual for starting and returning to personal work — alone when possible, with trusted people when helpful.

Pine is not a task manager, public social network or productivity game. Its core loop is `Return Card → activation step → solo or private Focus Pact → check-out → Open Seed`.

The web app is the first validation client. The target product client is React Native + Expo sharing a NestJS/PostgreSQL/Drizzle API.

## Current repository state

- `apps/web`: React/Vite validation client; UI and business functionality are in active transition.
- `apps/api`: NestJS/Drizzle scaffold with identity implemented; its legacy module layout is not yet the target Circle/Pact domain.
- `packages/contracts`: shared schema/types.
- `ml` and `services/inference-service`: experimental assets outside current product scope.
- `docs`: approved product and engineering source of truth.

Start with the [Product Direction](docs/00-foundation/product-direction.md), [MVP Scope](docs/00-foundation/mvp-scope.md) and [Engineering overview](docs/04-engineering/README.md).
