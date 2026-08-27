# Project Context for Implementation

## Product invariant

Một user luôn thấy một hành động chính phù hợp ở hiện tại. Retention phải giảm ma sát quay lại, không tăng áp lực hay tạo backlog overload.

## Current architecture

- `apps/web`: React/Vite UI; local demo khi API/Supabase chưa cấu hình.
- `apps/api`: Fastify + use cases/repositories/controllers theo module.
- `packages/contracts`: Zod schemas và shared event types.
- `supabase`: SQL migrations và RLS.

## Existing conventions

- API dưới `/api/v1`; authenticated member routes đi qua authorization guard.
- Raw Brain Dump/check-in được mã hóa; analytics không có raw content.
- User-owned persistence cần ownership check ở API và RLS ở database.
- Web phải hoạt động trong local demo; server-only behavior có fallback rõ ràng.

## Retention decisions

- Return eligibility: không có core event trong 3 ngày theo timezone profile.
- Reminder: default off, tối đa 2 slots, in-app trước; email provider deferred.
- Theme/audio URL: local-only ở phase đầu.
- Open Seed: tối đa một seed `open` mỗi user.
