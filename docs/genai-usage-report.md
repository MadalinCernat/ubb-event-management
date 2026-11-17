# GenAI Usage Report — Mid-Semester Delivery

## Botezatu Bianca

- Used Claude Code; mainly Sonnet
- Used it to organize user-research findings and product flows.
- Used it to assist with the NestJS authentication, organization, event, and registration modules.
- Generated or modified backend services, DTOs, validation, tests, API documentation, research notes, and product flows.
- Reviewed the output against the requirements and interview answers.
- Verified the backend with unit, API, and PostgreSQL E2E tests.
- Changed the suggested product flow so events remain public and sign-in is required only when registering.
- Chose stateless JWT authentication with salted `scrypt` password hashes.
- Chose row-level database locking to prevent concurrent registrations from exceeding capacity.

---

## Cernat Mădălin

- Used OpenAI Codex with different models;
- Used it for project setup, PostgreSQL integration, Prisma configuration, requirements, task planning, README instructions, and dependency troubleshooting.
- Generated or modified the initial frontend/backend setup, Prisma schema, migration, seed data, requirements, backlog, and developer documentation.
- Reviewed commands and generated files before using them.
- Verified the output with Prisma validation, builds, linting, unit tests, E2E tests, dependency-tree checks, and manual Docker/PostgreSQL checks.
- Reduced the original setup to only the required frontend, backend, and database foundation.
- Changed the backlog to use fewer, larger tasks limited to the mid-semester milestone.
- Chose generic email registration instead of requiring institutional email addresses.
- Chose user-created organizations, the `DRAFT`/`PUBLISHED`/`CANCELLED` lifecycle, and deferred attendance/check-in.


---

## Cernat Gabriel

- Used Claude Code; various models.
- Used it to assist with the Next.js pages, components, API client, server actions, forms, styling, tests, and limitations documentation.
- Generated or modified the authentication UI, event discovery, event details, manager dashboard, event forms, registration UI, and reusable frontend components.
- Reviewed the frontend against the backend API and the agreed product workflows.
- Verified the output with manual workflow checks, Vitest component tests, PostgreSQL E2E tests, and the Playwright critical-journey test.
- Stored the authentication token in a server-set `httpOnly` cookie instead of browser-accessible storage.
- Used Next.js server actions for mutations while keeping NestJS as the business API.
- Used Playwright for async Server Component pages instead of forcing them into unsuitable unit tests.
- Documented limitations such as timezone handling, opt-in E2E setup, client-side spots filtering, and serialized registration locking.


---
