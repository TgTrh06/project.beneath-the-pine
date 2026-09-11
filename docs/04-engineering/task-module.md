# Task Module

The Task module is the first complete vertical slice in the Java Core Service. It is intentionally small enough to study, but it includes the full path from HTTP input to domain rules and PostgreSQL persistence.

## Scope

The module owns two records:

- `Task`: a user-owned tiny action that takes between 1 and 10 minutes.
- `NextAction`: the immutable confirmation created with the initial task.

Focus sessions, AI generation, Redis, message queues and service-to-service events are outside this slice. They should integrate through explicit application ports later instead of being added directly to the Task domain.

## Package map

```text
task/
├── domain/          Plain Java business state and rules
├── application/     Use cases and the TaskRepository port
├── infrastructure/  JPA entities, Spring Data adapters and bean wiring
└── presentation/    REST controllers, request/response DTOs and HTTP error mapping
```

The dependency direction is inward:

```text
HTTP/session principal ──> application use case ──> domain
                     │
                     └──> TaskRepository port <── JPA/PostgreSQL adapter
```

Domain classes do not import Spring, JPA or HTTP types. Application tests therefore use an in-memory repository without starting Spring or Docker.

## Business rules

- A task title is trimmed and must contain 2–280 characters.
- A task must take 1–10 minutes.
- New tasks start in `ready`.
- `PATCH` can move a task between `ready`, `done` and `deferred`.
- Archiving uses a dedicated operation.
- An archived task is terminal and cannot be changed.
- The UUID in the authenticated account principal is the only source of `userId`.
- Reads and writes always query by both task ID and user ID. A task owned by another user is reported as not found.

## API

All routes require a valid `BTP_SESSION` cookie. State-changing requests also require the CSRF token returned by the auth session endpoint.

### Create a confirmed next action

```http
POST /api/v1/next-actions
Content-Type: application/json

{
  "title": "Open the notebook",
  "minutes": 5,
  "sourceBrainDumpId": null
}
```

The response is `201 Created` and contains both the task and its confirmation. The two rows are written in one database transaction.

### List tasks

```http
GET /api/v1/tasks?status=ready&limit=50
```

`status` is optional and accepts `ready`, `done`, `deferred` or `archived`. `limit` defaults to 50 and must be between 1 and 100.

### Read, update and archive

```http
GET /api/v1/tasks/{taskId}

PATCH /api/v1/tasks/{taskId}
Content-Type: application/json

{
  "title": "Write one line",
  "minutes": 3,
  "status": "done"
}

POST /api/v1/tasks/{taskId}/archive
```

At least one supported field is required in `PATCH`. Archiving is not accepted through `PATCH` so that this terminal transition stays explicit.

## Error behavior

Errors use the shared envelope with a stable `code`, safe `message`, `requestId` and optional validation details.

| Situation | HTTP | Code |
| --- | ---: | --- |
| Missing or invalid authentication | 401 | `UNAUTHENTICATED` or `INVALID_IDENTITY` |
| Invalid request fields or query parameters | 400 | `VALIDATION_FAILED` |
| Domain rule violation | 400 | `INVALID_TASK` |
| Missing task or another user's task | 404 | `TASK_NOT_FOUND` |
| Attempt to change an archived task | 409 | `TASK_ARCHIVED` |

Task titles are not written to application logs.

## Persistence

Flyway migration `V2__create_task_module.sql` creates `core.tasks` and `core.next_actions`. PostgreSQL check constraints repeat the most important domain invariants so invalid data cannot bypass the application layer.

Flyway migration `V3__create_accounts.sql` links `tasks.user_id` to the first-party account record. The account UUID is the ownership boundary; profile details can remain a separate lifecycle when introduced.

## How to study and extend this example

Follow one operation end to end in this order:

1. Start at `TaskController` or `NextActionController` to see boundary validation and authenticated-principal identity extraction.
2. Open the corresponding class in `application` to see orchestration.
3. Read `Task` for state transitions and invariants.
4. Read `TaskRepository` before its JPA implementation to see how the application is isolated from persistence.
5. Compare domain, application and integration tests to understand what each layer is responsible for proving.

When implementing the next module, copy the dependency direction and testing strategy, not the Task-specific classes. Add cross-module behavior through a named application port or event after the business need is clear.

## Validation commands

From the repository root:

```powershell
.\services\mvnw.cmd -f .\services\pom.xml -B verify
pnpm --filter @beneath-the-pine/contracts build
```

Docker Desktop must be running for the PostgreSQL Testcontainers tests. The integration test suite verifies Flyway, Hibernate schema validation, authentication, validation, ownership, CRUD behavior, archive behavior and database constraints.
