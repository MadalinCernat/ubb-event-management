# API

Base URL `http://localhost:3001`. Interactive documentation (Swagger UI): `/api/docs`, OpenAPI JSON: `/api/docs-json`.

## Conventions

- JSON; timestamps are ISO 8601 UTC (input must include a timezone, for example `2027-03-20T16:00:00Z`).
- Protected routes need `Authorization: Bearer <accessToken>` from `/auth/register` or `/auth/login`.
- The caller's identity always comes from the token, never from the request body.
- Errors always have this shape: `{ "statusCode": 409, "message": "Event is full", "error": "Conflict" }`. Validation errors (`400`) return `message` as a list of strings.
- Status codes: `400` validation, `401` missing or invalid token, `403` not allowed for this organization, `404` not found or not visible, `409` conflicts with current state, `500` unexpected (no details exposed).
- Lists: `{ items, total, page, pageSize }`, `pageSize` at most 50.

## Endpoints

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/register` | public | Create account, returns token (201) |
| `POST /auth/login` | public | Sign in, returns token |
| `POST /auth/logout` | user | Sign out; the client discards the token (204) |
| `GET /auth/me` | user | Current user and organization memberships |
| `POST /organizations` | user | Create organization; creator becomes manager (201) |
| `POST /organizations/:organizationId/members` | manager | Add an existing user (by email) as `MEMBER` or `MANAGER` (201) |
| `POST /organizations/:organizationId/events` | manager | Create a draft event (201) |
| `GET /events` | public | Published events; query `q`, `from`, `to`, `organizationId`, `page`, `pageSize` |
| `GET /events/:id` | public | Published event details; drafts and cancelled events only for managers (404 otherwise) |
| `PATCH /events/:id` | manager | Edit a draft or published event |
| `POST /events/:id/publish` | manager | `DRAFT` to `PUBLISHED` |
| `POST /events/:id/cancel` | manager | `DRAFT` or `PUBLISHED` to `CANCELLED` |
| `POST /events/:id/registrations` | user | Register for an event (201) |
| `DELETE /events/:id/registrations/me` | user | Cancel own registration before the event starts (204) |
| `GET /registrations/me` | user | Own active registrations |

## Business rules enforced by the API

- Event: `endsAt` after `startsAt`; capacity 1 to 100000 and never below the active registrations.
- Lifecycle: `DRAFT` to `PUBLISHED` or `CANCELLED`; `PUBLISHED` to `CANCELLED`; `CANCELLED` is final.
- Registration: event must be `PUBLISHED`, not started, not full, and the user not already registered. A cancelled registration can be re-activated. Capacity is checked under a row lock (`SELECT ... FOR UPDATE`) in one transaction, so concurrent requests cannot take the last place.
- Cancelling an event does not change its registrations; clients see the event status.
