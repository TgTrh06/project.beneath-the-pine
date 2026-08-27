# Infrastructure Plan

- **Status:** Proposed capabilities

## Required services

- Static/web hosting hoặc application hosting.
- API runtime.
- Managed PostgreSQL.
- Managed authentication.
- Secret management.
- Scheduled jobs.
- Error tracking/logging/metrics.
- Email/reminder provider nếu feature được bật.

## Environment isolation

- Staging và production dùng project/database/keys riêng.
- Production access theo least privilege.
- Không dùng production secrets trong preview builds.
- Region dữ liệu phải được xem xét trong privacy/legal review.

## Reliability baseline

- Health/readiness endpoints.
- Database connection pooling.
- Graceful shutdown.
- Migration chạy như bước được kiểm soát, không ngầm trong mọi app startup.
- Budget/quota alert cho AI và hạ tầng.

## Trước khi chọn provider

- Data region và processing terms.
- Backup/PITR.
- Export/portability.
- Logging redaction.
- Cost ở beta và khả năng scale.
- SLA/support cần thiết.

