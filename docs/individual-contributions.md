# Individual Contribution Declarations

These declarations are based on the repository's issues, commits, pull requests, files, and tests. Each student must personally review their section, correct any missing or inaccurate statement, and mark the approval checkbox before submission.

## Botezatu Bianca

### Owned workflow

- Authenticate users, resolve organization membership and roles, and authorize protected organization and event actions.

### Owned or substantially contributed artifacts

- User research and interview findings in `docs/user-research.md`.
- Product flows, wireframes, accessibility, and usability notes in `docs/product-flows.md`.
- Backend API documentation in `docs/api.md`.
- Authentication architecture decision in `docs/adr/0001-authentication.md`.
- Requirements-to-endpoint/test mapping in `docs/technical-project-document.md`.

### Implemented functionality

- Implemented the main NestJS backend API across authentication, organizations, events, and registrations.
- Added email/password registration and login, password hashing, token handling, current-user resolution, and authentication guards.
- Added organization creation, membership roles, and organization authorization checks.
- Added event creation, editing, publication, cancellation, discovery, filtering, validation, and lifecycle rules.
- Added registration, cancellation, duplicate prevention, capacity enforcement, and concurrency-safe database behavior.
- Added common validation helpers, Prisma error handling, exception formatting, and backend configuration.
- Added Swagger/OpenAPI setup and documented API conventions.

### Tests and verification

- Added unit tests for authentication, tokens, password handling, organization behavior, event rules/services, and registration services.
- Added API E2E tests for HTTP contracts, validation, authentication, authorization, and errors.
- Added PostgreSQL-backed E2E tests for persistence and concurrency behavior.
- Verified behavior against the requirements and recorded implementation status in the traceability document.

### Architectural and design decisions

- Contributed the authentication approach and its documented consequences.
- Contributed consistent DTO validation, error response conventions, authorization boundaries, and API pagination conventions.
- Contributed the database transaction/locking approach used to prevent registration overbooking.

### GenAI-related work

Used OpenAI Codex to assist with structuring user-research findings and product flows and with implementing/reviewing the backend API, business rules, documentation, and automated tests. Bianca verified the output against interview answers, requirements, API behavior, and unit/E2E tests, and made the scope, authentication, and concurrency decisions recorded in [`genai-usage-report.md`](./genai-usage-report.md).

### Evidence

- Commit `c54a3bd` — product flows and user research.
- Commit `970a804` / pull request #15 — backend API, tests, and supporting documentation.

---

## Cernat Mădălin

### Owned workflow

- Define and support event creation and publication through requirements, lifecycle rules, and the underlying event data model.

### Owned or substantially contributed artifacts

- Initial Next.js, NestJS, PostgreSQL, and repository setup.
- Root README, environment examples, database startup instructions, and developer commands.
- Mid-semester requirements in `docs/technical-project-document.md`.
- Mid-semester issue/backlog preparation in Github Kanban board.
- Prisma schema, SQL migration, seed data, Prisma configuration, and database provider integration.

### Implemented functionality

- Initialized the frontend and backend using the official framework generators.
- Connected the NestJS backend to PostgreSQL and added the initial database health endpoint.
- Defined the `User`, `Organization`, `Membership`, `Event`, and `Registration` data models.
- Added database relationships, indexes, unique constraints, event date/capacity checks, migrations, and fictional seed data.
- Added database generation, migration, deployment, seed, and reset scripts.
- Aligned incompatible NestJS package versions and regenerated the lockfile.

### Documentation produced

- Wrote the problem statement, scope, actors/roles, functional and non-functional requirements, use cases, workflows, and acceptance criteria.
- Documented local setup, PostgreSQL/Docker access, application startup, migrations, seeding, and reset procedures.

### Tests and verification

- Validated and generated the Prisma client.
- Verified backend build and lint checks after database integration.
- Ran the backend unit and E2E suites after dependency alignment.
- Verified the resolved NestJS dependency tree contained compatible versions.

### Architectural and design decisions

- Contributed the modular Next.js/NestJS/PostgreSQL project structure.
- Defined the initial relational model and database-level integrity rules.
- Contributed scope decisions including generic email registration, UTC storage, the event lifecycle, and deferred post-MVP features.

### GenAI-related work

Complete this section from Mădălin's entries in [`genai-usage-report.md`](./genai-usage-report.md) after he confirms them.

### Evidence

- Commit `727fa45` — initial frontend/backend/database setup.
- Commit `c9e3c5a` — frontend environment example and generated-file cleanup.
- Commit `66d9ac4` / pull request #12 — MVP requirements.
- Commit `7bf89ea` / pull request #13 — Prisma schema, migration, seed, and database integration.
- Commit `77d812e` — NestJS dependency alignment.

**Personal approval:** [ ] Cernat Mădălin confirms that this statement is complete and accurate.

---

## Cernat Gabriel

### Owned workflow

- Discover published events, open event details, register or cancel registration, and verify the journey end to end.

### Owned or substantially contributed artifacts

- Initial application frontend for authentication, event discovery, event management, organizations, and registrations.
- Reusable frontend components, API client, server actions, authentication session handling, forms, and date/time utilities.
- Frontend unit-test and Playwright E2E setup.
- Known limitations documentation in `docs/known-limitations.md`.

### Implemented functionality

- Built the registration and login pages and authenticated navigation.
- Built public event discovery, search/filter controls, event cards, event details, loading, error, and not-found states.
- Built organization creation, manager dashboard, event creation/editing, publication, and cancellation interfaces.
- Built own-registration listing, registration, and cancellation interactions.
- Added the frontend API client, typed API models, server actions, form helpers, and authentication-cookie/session handling.
- Extended backend event listing needed by the manager dashboard.
- Added responsive styling and reusable status, form-message, and submit-button components.

### Tests and verification

- Added frontend component/unit tests for event cards, event forms, form errors, status badges, and date/time conversion.
- Added the Playwright critical-journey test covering the integrated MVP flow.
- Expanded PostgreSQL-backed E2E coverage for MVP workflows and edge cases.
- Documented testing constraints, filters, timezone behavior, concurrency, authorization, and organization-name limitations.

### Architectural and design decisions

- Contributed the server-rendered Next.js frontend structure and separation between UI, server actions, API access, and session handling.
- Contributed the frontend handling of authentication, user roles, loading/error states, and Europe/Bucharest date presentation.
- Contributed the integrated critical user journey used for E2E verification.

### GenAI-related work

Used OpenAI Codex to assist with the Next.js frontend, server actions, authentication/session integration, reusable UI, testing configuration, workflow tests, and limitations documentation. Gabriel verified the output through manual workflow review, component tests, database-backed tests, and Playwright, and made the token-storage and test-level decisions recorded in [`genai-usage-report.md`](./genai-usage-report.md).

### Evidence

- Commit `4602558` / pull request #16 — frontend application and related backend additions.
- Commit `4d943ec` / pull request #17 — MVP workflow tests and known limitations.

---
