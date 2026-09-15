# 08 — Operations

Tài liệu vận hành cho NestJS/Drizzle với web trước, mobile sau API gate. Chưa chọn hosting backend hoặc hạ tầng job. `apps/api` là Core duy nhất; PostgreSQL Docker hiện chỉ dành cho local development.

- [Infrastructure Plan](infrastructure-plan.md)
- [CI/CD](ci-cd.md)
- [Deployment Runbook](deployment-runbook.md)
- [Observability](observability.md)
- [Backup and Recovery](backup-and-recovery.md)
- [Incident Response](incident-response.md)

Web có cấu hình Vercel hiện có. Supabase giữ schema history; không phải identity provider mặc định đã chọn cho mobile. Redis/RabbitMQ và service extraction là phương án có điều kiện. Mọi deployment, thay đổi remote service hoặc production migration cần scope và ủy quyền riêng.
