# Traceability

| Requirement | Endpoint(s) | Tests | Status |
| --- | --- | --- | --- |
| FR-01 Register an account | `POST /auth/register` | `auth.service.spec.ts`, `api.e2e-spec.ts` | Backend done |
| FR-02 Authenticate | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | `auth.service.spec.ts`, `token.service.spec.ts`, `api.e2e-spec.ts` | Backend done |
| FR-03 Create organization | `POST /organizations` | `organizations.service.spec.ts` | Backend done |
| FR-04 Organization permissions | `POST /organizations/:id/members`, all manager routes | `organizations.service.spec.ts`, `events.service.spec.ts`, `api.e2e-spec.ts` | Backend done |
| FR-05 Create event | `POST /organizations/:id/events` | `events.service.spec.ts` | Backend done |
| FR-06 Edit event | `PATCH /events/:id` | `events.service.spec.ts` | Backend done |
| FR-07 Publish event | `POST /events/:id/publish` | `events.service.spec.ts`, `event-rules.spec.ts` | Backend done |
| FR-08 Cancel event | `POST /events/:id/cancel` | `events.service.spec.ts`, `event-rules.spec.ts` | Backend done |
| FR-09 Discover events | `GET /events` | `events.service.spec.ts`, `api.e2e-spec.ts` | Backend done |
| FR-10 Event details | `GET /events/:id` | `events.service.spec.ts` | Backend done |
| FR-11, FR-12 Register, reject invalid | `POST /events/:id/registrations` | `registrations.service.spec.ts` | Backend done |
| FR-13 Cancel own registration | `DELETE /events/:id/registrations/me` | `registrations.service.spec.ts` | Backend done |
| FR-14 Capacity under concurrency | `POST /events/:id/registrations` | `db.e2e-spec.ts` (needs PostgreSQL, `RUN_DB_TESTS=true`) | Written, run against a database before relying on it |
| FR-16 Consistent errors | all | `api.e2e-spec.ts` | Backend done |

Frontend screens for these requirements are tracked in issue 5.
