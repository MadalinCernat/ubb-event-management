# UBB Event Management — Mid-Semester Technical Project Document

## 1. Problem statement and scope

Student events are commonly promoted through scattered Instagram posts, messaging groups, and separate registration forms. Students may find events too late, while organizers must manually keep event information and participant counts synchronized.

UBB Event Management provides one web application where:

- users create accounts and organizations;
- organization managers create and publish events;
- visitors discover published events;
- authenticated users register and cancel their own registrations;
- PostgreSQL stores users, organizations, events, and registrations.

### Included in the MVP

- Email/password registration, sign-in, sign-out, and current-user identification.
- Organization creation; the creator becomes its first manager.
- Membership roles and organization-level authorization.
- Event creation, editing, publication, cancellation, and public discovery.
- Search and filtering by text, date, and organization.
- Event registration, cancellation, duplicate prevention, and capacity enforcement.
- Next.js frontend, NestJS REST API, PostgreSQL, Prisma migrations, and seed data.
- Validation, consistent errors, and automated tests for critical rules.

### Deferred until after the mid-semester delivery

- Attendance and QR check-in.
- Notifications and reminders.
- Waitlists, analytics, calendar integrations, and recommendations.
- System-administrator functionality.
- Institutional-email-only registration.

### Main decisions

- Any unique valid email is accepted; a UBB email is not required.
- Users may create organizations and automatically become managers.
- Dates are stored in UTC and displayed in `Europe/Bucharest` for the demo.
- Backend rules remain authoritative even when the frontend performs the same checks.

## 2. High-level requirements

### Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | A visitor can register using a unique email and password. |
| FR-02 | A registered user can sign in, sign out, and access their current-user information. |
| FR-03 | An authenticated user can create an organization and becomes its manager. |
| FR-04 | Protected actions require the correct organization role. |
| FR-05 | A manager can create a draft event for an organization they manage. |
| FR-06 | A manager can edit an eligible event. |
| FR-07 | A manager can publish a valid draft event. |
| FR-08 | A manager can cancel a draft or published event. |
| FR-09 | Anyone can browse, search, and filter published events. |
| FR-10 | Anyone can view public details for a published event. |
| FR-11 | An authenticated user can register for an eligible event. |
| FR-12 | The system rejects duplicate, full, cancelled, unpublished, or started-event registrations. |
| FR-13 | A user can cancel their own registration before the event starts. |
| FR-14 | Concurrent registrations cannot exceed event capacity. |
| FR-15 | Application data is persisted in PostgreSQL through migrations. |
| FR-16 | The API returns consistent validation, authentication, authorization, conflict, and server errors. |

### Non-functional requirements

- **Security:** passwords are salted and hashed; tokens and secrets are not exposed or logged; authorization is enforced in NestJS.
- **Integrity:** foreign keys, unique constraints, transactions, and migrations protect important data rules.
- **Validation:** all external input is validated by the backend.
- **Usability:** workflows require no manual database changes and include loading, empty, validation, authorization, and error states.
- **Accessibility:** forms have labels, keyboard access, and understandable feedback.
- **Maintainability:** controllers, services, data access, and frontend API code have separate responsibilities.
- **Testability:** critical rules, denial cases, HTTP contracts, database behavior, and the main browser journey have automated tests.
- **Reproducibility:** environment examples, Docker instructions, migrations, seed data, and run commands are documented.

## 3. Actors and roles

| Actor | Allowed actions | Restrictions |
| --- | --- | --- |
| Visitor | Browse/search published events, view details, register an account, sign in. | Cannot register for events or access protected organization functionality. |
| Authenticated user/student | Create organizations, register for events, view and cancel own registrations. | Cannot manage unrelated organizations or view private participant data. |
| Organization member | Has a membership and normal authenticated-user access. | Cannot manage events without the manager role. |
| Organization manager/organizer | Create, edit, publish, and cancel events for managed organizations. | Cannot manage another organization's events. |

The system-administrator role is outside the current MVP.

## 4. Event and registration rules

### Event fields

An event requires an organization, title, description, location, start time, end time, positive capacity, status, and creator.

### Event lifecycle

- New events start as `DRAFT`.
- `DRAFT` can become `PUBLISHED` or `CANCELLED`.
- `PUBLISHED` can become `CANCELLED`.
- `CANCELLED` is final.
- The end time must be later than the start time.

### Registration rules

- The user must be authenticated.
- The event must be `PUBLISHED` and not started.
- Capacity must be available.
- A user cannot have two active registrations for the same event.
- A cancelled registration may be reactivated.
- Capacity is checked inside a transaction using a row lock.
- A user may cancel only their own registration before the event starts.

## 5. Use cases

### UC-01 — Register an account

**Actor:** Visitor. The visitor submits a display name, email, and password. The system validates the input, checks email uniqueness, hashes the password, creates the account, and returns an authenticated session. Invalid or duplicate data is rejected.

### UC-02 — Sign in

**Actor:** Registered user. The user submits email and password. Valid credentials create an authenticated session; invalid credentials return a generic authentication error.

### UC-03 — Create an organization

**Actor:** Authenticated user. The user submits organization details. The system creates the organization and a manager membership for its creator.

### UC-04 — Create and publish an event

**Actor:** Organization manager. The manager creates a valid draft, edits it if necessary, and publishes it. The backend checks organization permission, fields, dates, capacity, and lifecycle transitions. The published event becomes publicly visible.

### UC-05 — Discover an event

**Actor:** Visitor or authenticated user. The user browses published events, optionally filters them, and opens an event detail page containing public information and availability.

### UC-06 — Register for an event

**Actor:** Authenticated user. The backend checks event status, start time, capacity, and existing registration before creating or reactivating the registration. Invalid registration attempts are rejected without overbooking.

### UC-07 — Cancel a registration

**Actor:** Registered participant. The participant cancels their own active registration before the event starts. The system rejects cancellation of another user's registration or cancellation after the start time.

## 6. Main application workflows

### Workflow A — Authentication and authorization

1. A visitor registers or signs in.
2. The authenticated user creates an organization or uses an existing membership.
3. Protected requests include the authenticated identity.
4. The backend resolves membership and role for the target organization.
5. Authorized actions continue; other requests return `401` or `403`.

**Acceptance criteria:**

- Registration, sign-in, and sign-out work through the UI.
- Organization creators become managers.
- Unauthenticated protected requests return `401`.
- Users without the required role receive `403`.
- Managers cannot manage unrelated organizations.

### Workflow B — Create and publish an event

1. A manager opens the event dashboard.
2. The manager creates and optionally edits a draft event.
3. The manager publishes the valid draft.
4. The event appears in public discovery.
5. The manager may cancel a draft or published event.

**Acceptance criteria:**

- Valid events can be created, edited, published, and cancelled.
- Invalid dates and non-positive capacity are rejected.
- Illegal lifecycle transitions and unauthorized actions are rejected.
- Event data persists in PostgreSQL.

### Workflow C — Discover and register

1. A visitor browses or filters published events.
2. The visitor opens event details.
3. The visitor signs in when registration is requested.
4. The authenticated user registers if eligible and capacity is available.
5. The user may cancel their own registration before the event starts.

**Acceptance criteria:**

- Only published events appear publicly.
- Search and date/organization filters work.
- Public responses contain no private participant data.
- Duplicate, full, cancelled, unpublished, and started-event registrations are rejected.
- Concurrent requests cannot exceed capacity.
- Users can cancel only their own eligible registrations.

Detailed flows and wireframes are available in [`product-flows.md`](./product-flows.md).

## 7. Requirements traceability

| Requirements | Implementation | Verification | Status |
| --- | --- | --- | --- |
| FR-01–FR-02 | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Auth/token/password unit tests and API E2E tests | Implemented |
| FR-03–FR-04 | Organization endpoints, memberships, guards, authorization service | Organization service and API E2E tests | Implemented |
| FR-05–FR-08 | Event module and lifecycle rules | Event service/rule tests and API E2E tests | Implemented |
| FR-09–FR-10 | Public event list/detail endpoints and Next.js pages | Event service tests, frontend tests, Playwright journey | Implemented |
| FR-11–FR-13 | Registration endpoints and frontend actions | Registration service tests, API and browser E2E tests | Implemented |
| FR-14 | Transaction and `SELECT ... FOR UPDATE` capacity lock | PostgreSQL concurrency E2E test | Implemented; database test requires explicit setup |
| FR-15 | Prisma schema, SQL migration, seed data | Migration/seed commands and database E2E tests | Implemented |
| FR-16 | DTO validation and global exception filter | API E2E error/validation tests | Implemented |

## 8. UX research summary

Interviews identified fragmented event discovery, late announcements, duplicated questions, and manual capacity tracking. The MVP was adjusted to:

- keep event discovery public;
- require sign-in only when registering;
- show date, location, and remaining places prominently;
- use one-action registration without another form;
- accept any email address;
- defer reminders, messaging, and attendance.

Full interview notes are in [`user-research.md`](./user-research.md).

## 9. Supporting documentation

- [`product-flows.md`](./product-flows.md) — product flows and wireframes
- [`user-research.md`](./user-research.md) — interviews and changed assumptions
- [`api.md`](./api.md) — API contract and business rules
- [`adr/0001-authentication.md`](./adr/0001-authentication.md) — authentication decision
- [`known-limitations.md`](./known-limitations.md) — known constraints
- [`genai-usage-report.md`](./genai-usage-report.md) — GenAI declaration
- [`individual-contributions.md`](./individual-contributions.md) — individual declarations

## 10. Submission checklist

- [x] Problem statement and scope
- [x] High-level requirements
- [x] Actors and roles
- [x] Use cases
- [x] Main application workflows
- [x] Requirements traceability
- [x] UX research and product flows
- [x] GenAI usage report
- [x] Individual contribution declarations
