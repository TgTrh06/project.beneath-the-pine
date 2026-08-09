# Modular Clean Architecture backend

Backend ở `apps/api` được tổ chức theo các domain đang có thật trong sản phẩm:

- `auth`: Supabase identity adapter.
- `user`: beta authorization, profile, consent, bootstrap và account data.
- `beta`: waitlist, invite và beta approval.
- `task`: next action và focus session.
- `habit`: giới hạn ba habits và daily completion.
- `capture`: Brain Dump, check-in, weekly review, export nội dung mã hóa và purge.
- `analytics`: product events và AI quota.

Mỗi module có `domain`, `application`, `infrastructure`, và `presentation` khi cần. `src/presentation/registerApiRoutes.ts` là composition root duy nhất: nó tạo Drizzle/Supabase/OpenAI adapters, inject chúng vào use cases, và nối controller vào Fastify route.

Domain/application không import Fastify, Drizzle, Postgres hoặc Supabase. Supabase client được tạo duy nhất trong `shared/infrastructure/supabase/SupabaseClientFactory.ts`; nội dung riêng tư dùng `AesGcmContentCipher` adapter. API paths và schema database được giữ nguyên trong refactor.

Các module `workspace`, `project`, `note`, `notification` không được tạo rỗng vì product beta chưa có API hay schema tương ứng. Khi được thêm vào product, mỗi module sẽ theo cùng cấu trúc thay vì dùng thư mục controller/service/repository toàn cục.
