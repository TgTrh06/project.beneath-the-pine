# Identity

Implemented email/password registration and login, opaque PostgreSQL sessions, HttpOnly cookies, CSRF, session rotation/revocation and bounded in-process authentication rate limiting. Accounts have no product role. There is no public role mutation or admin account-listing endpoint.

HTTP: `GET auth/session`, `POST auth/register`, `POST auth/login`, `POST auth/logout` under `/api/v1`. Realtime uses the same cookie but independently validates Origin and room access.
