# Known Limitations

## Testing

### Database-backed and E2E tests require manual setup

The backend database integration tests (`backend/test/db.e2e-spec.ts`) require
a running PostgreSQL database with migrations applied. They are skipped by
default and must be enabled explicitly:

```sh
# from /backend
$env:RUN_DB_TESTS='true'; npm run test:e2e   # PowerShell
RUN_DB_TESTS=true npm run test:e2e            # bash
```

The Playwright browser E2E tests (`frontend/e2e/`) similarly require both the
Next.js frontend and NestJS backend to be running. Tests are skipped unless
`RUN_E2E=true` is set:

```sh
# Start backend (in /backend):  npm run start:dev
# Then, from /frontend:
RUN_E2E=true npm run test:e2e
```

### Server Component pages are not covered by Vitest unit tests

Per Next.js recommendations, async Server Components cannot be unit-tested with
Vitest. Pages such as `/events`, `/events/[id]`, and `/dashboard` are covered
by the Playwright E2E test instead. Client components and utility functions are
covered by Vitest.

## Filters and pagination

### "Spots available" filter is client-side only

The event list's "Spots available" checkbox filters the current page of results
in the browser after they are fetched. It does not reduce the total count
returned by the backend, so the pagination total may be higher than the number
of cards visible on screen when the filter is active.

## Date and timezone handling

### Event times are displayed in `Europe/Bucharest` (UTC+2/+3)

The frontend always formats dates in the `Europe/Bucharest` timezone regardless
of where the user is located. This is intentional for the semester demo (see
`lib/datetime.ts`). The EventForm uses the browser's local timezone when
entering dates, so a manager in a different timezone will see a different
displayed time than what they typed.

### Datetime round-trip at DST boundaries

When editing an event, the form converts the stored UTC timestamp to a
`datetime-local` value in the browser's local timezone and back to UTC on
save. At daylight-saving-time boundaries, a one-hour shift may occur if the
manager's local clock is affected by DST. The database constraint
(`endsAt > startsAt`) will catch pathological cases.

## Concurrency

### Row-level locking only protects against overbooking; events still serialise under high load

The `lockEvent` helper issues a `SELECT ... FOR UPDATE` on the event row. This
prevents overbooking but means concurrent registrations for the same event are
serialised at the database level. Under high throughput this can cause
request queuing. For the expected class-project load this is acceptable.

## Authorization

### There is no "student" role; any authenticated user can register

Role differentiation is between "no account", "authenticated user", and
"organization manager". Any authenticated user may register for any published
event. There is no invitation-only or role-restricted registration.

### Members (non-manager role) cannot use the dashboard

The `Membership` table supports a `MEMBER` role, but the current UI and API only
grant dashboard access and event management capabilities to `MANAGER` members.
`MEMBER` memberships can be created via `POST /organizations/:id/members` but
the role has no effect on the current feature set.

## Organizations

### Organization names must be globally unique

The `Organization` table has a unique constraint on `name`. Attempting to create
two organizations with the same name returns a 409 Conflict error.
