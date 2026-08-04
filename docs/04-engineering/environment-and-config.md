# Environment and Configuration

## Environments

| Environment | Mục đích | Dữ liệu thật |
|---|---|---|
| Local | Phát triển | Không |
| Test | Automated tests | Synthetic only |
| Staging | QA/private demo | Chỉ tester đã consent |
| Production | Beta/public | Có |

## Configuration categories

- App URL/API URL.
- Database connection.
- Auth provider keys.
- AI provider key/model/timeout/quota.
- Email/reminder provider.
- Error tracking và metrics.
- Feature flags.
- Encryption/signing keys.

## Rules

- Có `.env.example` nhưng không có secret thật.
- Startup fail-fast nếu thiếu biến bắt buộc.
- Log chỉ tên config thiếu, không log giá trị secret.
- Secret production lưu trong secret manager.
- Tách key giữa staging và production.
- Không dùng dữ liệu production để test local.

