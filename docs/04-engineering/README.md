# 04 — Engineering

Phần này giải thích cách sản phẩm trở thành một dịch vụ đáng tin cậy: stack hiện tại, system boundary, quyết định dữ liệu và quy tắc vận hành.

## Hình dạng hiện tại

Implementation đang hoạt động gồm React 19/Vite web client, Fastify/Node API, shared Zod contracts và Supabase Postgres/Auth với Drizzle. Vercel host web build; Render được cấu hình cho API và purge job. Native mobile và desktop nằm ngoài scope hiện tại.

## Đọc theo công việc

| Khi cần… | Hãy đọc |
| --- | --- |
| Hiểu runtime choices đã duyệt | [Technology Stack](technology-stack.md) |
| Theo một request xuyên hệ thống | [System Architecture](system-architecture.md) |
| Làm việc với API module hoặc dependency boundary | [Modular Backend Architecture](modular-backend-architecture.md) |
| Làm việc với pilot inference service | [Local Inference Architecture](local-inference-architecture.md) |
| Thay đổi data hoặc migrations | [Data Model](data-model.md) và [API Guidelines](api-guidelines.md) |
| Cấu hình môi trường local/deployed | [Environment & Configuration](environment-and-config.md) |
| Chuẩn bị hoặc review implementation | [Engineering Standards](engineering-standards.md) |
| Ra một quyết định kiến trúc bền vững | [Architecture Decision Records](adr/README.md) |

## Ranh giới làm việc

Tài liệu kiến trúc mô tả cả hình dạng mong muốn lẫn hiện tại. Khi code và tài liệu quyết định khác nhau, hãy tìm nguyên nhân và ghi ADR trước khi đổi kiến trúc đáng kể. Với delivery retention, đọc thêm [AI Implementation Handbook](../ai/README.md).
