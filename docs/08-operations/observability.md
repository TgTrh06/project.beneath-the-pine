# Observability

- **Status:** Baseline

## Signals

### Application

- Request rate/error/latency theo endpoint.
- Auth failures và rate limits.
- Database pool, slow queries và migration state.
- Scheduled job success/failure/duration.

### AI

- Calls, latency, timeout, retry.
- Model/prompt version.
- Input/output tokens và cost estimate.
- Schema invalid rate.
- Safety flag và manual feedback aggregate.

### Product

- Activation và Stuck-to-Start Rate.
- Reset/Return funnel.
- Không đưa raw content vào analytics.

## Logging

- Structured JSON.
- Request/correlation ID.
- Redact secrets và user content.
- Access control và retention theo môi trường.

## Alerts tối thiểu

- Production unavailable.
- Error rate tăng đột biến.
- Database storage/connection pressure.
- Job weekly review thất bại hàng loạt.
- AI cost vượt budget hoặc invalid output tăng.
- Export/delete job quá SLA.

