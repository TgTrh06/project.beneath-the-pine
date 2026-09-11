# 08 — Operations

Tài liệu vận hành cho hướng NestJS/Drizzle với web trước, mobile sau API gate. Chưa chọn hosting backend hoặc hạ tầng job. Giai đoạn hiện tại chỉ cập nhật tài liệu; code/config/CI vẫn có baseline backend cũ và draft NestJS.

- [Infrastructure Plan](infrastructure-plan.md)
- [CI/CD](ci-cd.md)
- [Deployment Runbook](deployment-runbook.md)
- [Observability](observability.md)
- [Backup and Recovery](backup-and-recovery.md)
- [Incident Response](incident-response.md)

Web có cấu hình Vercel hiện có. Supabase giữ schema history; không phải identity provider mặc định đã chọn cho mobile. Redis/RabbitMQ và service extraction là phương án có điều kiện. Mọi deployment, thay đổi remote service hoặc production migration cần scope và ủy quyền riêng.
