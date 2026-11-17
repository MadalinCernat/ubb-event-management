# ADR 0001: Authentication approach

## Context

The MVP needs email and password sign-in, sign-out, and a current-user endpoint. The frontend is a separate Next.js app.

## Decision

Stateless bearer tokens (HS256 JWT signed with `JWT_SECRET`, default lifetime 1 hour) generated with `node:crypto`. Passwords are hashed with `scrypt` and a random salt per user, using the same `scrypt$salt$hash` format as `prisma/seed.ts`.

## Consequences

- No session table and no extra auth library.
- `POST /auth/logout` cannot revoke a token; the client discards it and the token expires on its own. Server-side revocation would need a session table or token denylist.
- `JWT_SECRET` must be set in production; the backend refuses to start without it.
- The frontend must store the token safely (for example an httpOnly cookie set by the Next.js server) and send it as `Authorization: Bearer`.
