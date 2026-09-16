# Technology Stack

- **Backend:** NestJS + TypeScript modular monolith.
- **Database:** PostgreSQL + Drizzle.
- **Web validation client:** React + Vite.
- **Target mobile client:** React Native + Expo.
- **Realtime:** Socket.IO through the NestJS adapter; HTTP owns durable commands and the single-instance gateway owns ephemeral presence.
- **Pine Assistance:** QLoRA/local GGUF experimentation behind a server-only adapter after ML release gates.

Providers for push, analytics hosting, audio or payment are intentionally unselected until their slices have evidence and an approved plan. A hosted AI provider is optional; the existing local inference path is evaluated under ML governance.
