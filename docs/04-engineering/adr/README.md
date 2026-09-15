# Architecture Decision Records

## Quyết định hiện hành

- [ADR-0013 — Wanderer / Pine Keeper auth](0013-wanderer-pine-keeper-auth.md) — Accepted.

- [ADR-0011 — NestJS, Drizzle và React Native + Expo](0011-nestjs-drizzle-mobile-direction.md) — Accepted.
- [ADR-0012 — Core modular monolith, inference độc lập, worker theo nhu cầu](0012-modular-monolith-proposal.md) — Accepted.
- [ADR-0006 — Gentle Retention and Reminder Delivery](0006-gentle-retention-and-reminders.md) — nguyên tắc sản phẩm liên quan.

## Lịch sử liên quan

- [ADR-0007 — Node.js/TypeScript](0007-node-typescript-primary-stack.md) — Superseded; không phục hồi lựa chọn Fastify/identity cũ.
- [ADR-0009 — Redis/RabbitMQ và service extraction](0009-redis-rabbitmq-microservices.md) — Superseded; không còn lộ trình bắt buộc.

Các bản ghi công nghệ đã loại bỏ khỏi bộ tài liệu có thể tra cứu trong Git. Giữ số ADR ổn định, không đánh lại số để lấp khoảng trống.

## Mẫu

Một ADR ghi trạng thái Proposed / Accepted / Superseded, ngày, bối cảnh, quyết định, phương án khác, hệ quả, security/data impact, validation và rollback. Chỉ ghi Accepted khi có quyết định thực sự; trạng thái implementation được ghi riêng.
