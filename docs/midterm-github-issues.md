# Mid-Semester GitHub Issues

The issues below cover only the mid-semester milestone. They are ordered by dependency and do not assign work to specific team members.

## 1. Define the MVP scope and high-level requirements

**Suggested labels:** `midterm`, `documentation`, `requirements`

**Deliverable:** [`requirements.md`](./requirements.md)

### Description

Define the problem the application solves and agree on the exact MVP scope required for the mid-semester delivery.

### Tasks

- Write the problem statement.
- Define the project scope and objectives.
- Document the high-level functional requirements.
- Document important non-functional requirements, including security, validation, persistence, and usability.
- Define the actors and roles:
  - Visitor/student
  - Organization member
  - Organization manager/event organizer
- Document the main use cases.
- Describe the main application workflows:
  - Authenticate and authorize organization actions
  - Create and publish an event
  - Discover and register for an event
- Record acceptance criteria for each main workflow.
- Explicitly separate mid-semester functionality from deferred features.

### Acceptance criteria

- [ ] The problem statement and scope are documented.
- [ ] Functional and non-functional requirements are documented.
- [ ] Actors, roles, and permissions are clearly defined.
- [ ] Main use cases and workflows are documented.
- [ ] Each main workflow has testable acceptance criteria.
- [ ] Deferred features are explicitly marked as out of scope.

---

## 2. Conduct user research and define the main product flows

**Suggested labels:** `midterm`, `documentation`, `ux`

### Description

Validate the team's initial assumptions through interviews with real prospective users and use the findings to refine the MVP flows.

### Tasks

- Define the research objective and interview questions.
- Interview relevant prospective users, such as students and student-organization organizers.
- Record anonymized participant context without unnecessary personal data.
- Summarize the main findings and recurring user needs or problems.
- Identify assumptions that were confirmed or invalidated.
- Document changes made to the initial product assumptions because of the interviews.
- Define the main product flows for authentication, event management, event discovery, and registration.
- Add low-fidelity wireframes where they help explain a flow.
- Record basic accessibility and usability considerations.

### Acceptance criteria

- [ ] The research method and participant types are documented.
- [ ] Findings are based on interviews with real users.
- [ ] The main findings and changed assumptions are clearly stated.
- [ ] Product decisions resulting from the interviews are documented.
- [ ] The main product flows are consistent with the agreed MVP scope.
- [ ] Interview notes are anonymized.

### Depends on

- Issue 1

---

## 3. Implement the initial PostgreSQL data model

**Suggested labels:** `midterm`, `database`, `backend`

**Deliverables:** [`schema.prisma`](../backend/prisma/schema.prisma), [`migration.sql`](../backend/prisma/migrations/20261117190000_initial_schema/migration.sql), and [`seed.ts`](../backend/prisma/seed.ts)

### Description

Create the migration-backed PostgreSQL schema needed by the main MVP workflows.

### Tasks

- Configure Prisma to connect to PostgreSQL.
- Create models for:
  - User
  - Organization
  - Membership
  - Event
  - Registration
- Define role, event-status, and registration-status values.
- Add primary keys, foreign keys, timestamps, indexes, and required unique constraints.
- Prevent duplicate organization memberships.
- Prevent duplicate active registrations for the same user and event.
- Add appropriate rules for event dates and capacity.
- Create and commit the initial migration.
- Add fictional seed data for local development and demonstrations.
- Document migration, seed, and database reset commands.
- Keep a database health/readiness endpoint.

### Acceptance criteria

- [ ] A fresh PostgreSQL database can be initialized using committed migrations.
- [ ] The schema supports the three main MVP workflows.
- [ ] Relationships and important uniqueness rules are enforced by PostgreSQL.
- [ ] Seed data creates enough fictional data to demonstrate the application.
- [ ] No real personal data or secrets are committed.
- [ ] Migration, seed, and reset commands are documented.

### Depends on

- Issue 1

---

## 4. Implement the main backend API

**Suggested labels:** `midterm`, `backend`, `testing`

### Description

Implement the NestJS REST API, business rules, authentication, and persistence needed by the main MVP workflows.

### Tasks

#### Authentication and organizations

- Implement sign-in, sign-out, and current-user endpoints using the agreed authentication approach.
- Hash passwords securely if local email/password authentication is used.
- Implement organization membership roles.
- Add authentication guards and centralized authorization checks.
- Return consistent `401` and `403` responses.

#### Event management

- Implement endpoints to create, read, update, publish, and cancel events.
- Validate required fields, event dates, and capacity.
- Enforce event lifecycle transitions.
- Restrict event-management operations to authorized organization members.

#### Discovery and registration

- Implement public endpoints for published-event listing and event details.
- Add basic search and filtering.
- Implement registration and own-registration cancellation endpoints.
- Reject duplicate, full, cancelled, and unpublished event registrations.
- Use a transaction or atomic strategy to prevent capacity overbooking.

#### Shared API concerns

- Define consistent route names, DTOs, status codes, and error response shapes.
- Validate all external input at the API boundary.
- Ensure public endpoints do not expose private participant information.
- Store timestamps in UTC.
- Add OpenAPI/Swagger documentation for implemented endpoints.
- Add unit and API tests for critical rules and failure cases.

### Acceptance criteria

- [ ] Authentication and authorization protect restricted operations.
- [ ] Authorized users can create, edit, publish, and cancel events.
- [ ] Public users can retrieve only published event information.
- [ ] Authenticated users can register and cancel their own registration.
- [ ] Event validation, lifecycle, duplicate-registration, and capacity rules are enforced.
- [ ] Concurrent requests cannot overbook the final available place.
- [ ] API errors and status codes are consistent.
- [ ] Critical backend behavior is covered by automated tests.
- [ ] Implemented endpoints appear in the API documentation.

### Depends on

- Issues 1 and 3

---

## 5. Implement the initial frontend application

**Suggested labels:** `midterm`, `frontend`, `ux`

### Description

Build the initial Next.js interface for the main MVP workflows and connect it to the NestJS API.

### Tasks

#### Authentication and organization context

- Build the sign-in interface.
- Add authenticated-user state and sign-out behavior.
- Display the current organization and role where relevant.
- Show management actions only when appropriate for the current user.

#### Event management

- Build an organizer event list or dashboard.
- Build create and edit event forms.
- Add publish and cancel actions.
- Display event status and validation feedback.

#### Discovery and registration

- Build the published-event list.
- Add basic search and filters.
- Build the event-detail page.
- Add registration and own-registration cancellation actions.
- Display registration status and full-event state.

#### Shared frontend concerns

- Create a reusable backend API client.
- Configure the backend base URL through the environment.
- Add basic navigation and responsive styling.
- Follow the product flows and interview findings.
- Handle loading, empty, success, validation, unauthorized, and server-error states.
- Provide labels, keyboard support, and understandable form feedback.

### Acceptance criteria

- [ ] A manager can sign in, create an event, and publish it through the UI.
- [ ] A student can browse events, open an event, and register through the UI.
- [ ] The frontend communicates only through the documented backend API.
- [ ] Important loading, empty, validation, authorization, and error states are handled.
- [ ] Forms are accessible by keyboard and have clear labels and feedback.
- [ ] The main flows are usable on desktop and a narrow mobile viewport.

### Depends on

- Issues 2 and 4

---

## 6. Integrate and test the main MVP workflows

**Suggested labels:** `midterm`, `testing`, `integration`

### Description

Integrate the frontend, backend, and database work and verify the most important user journeys and negative cases.

### Tasks

- Test the complete journey:
  - Sign in as an organization manager
  - Create and publish an event
  - Browse the event as a student
  - Register for the event
- Add database-backed integration tests.
- Add at least one browser E2E test for the critical journey.
- Verify invalid event dates and illegal lifecycle transitions.
- Verify unauthenticated, unauthorized, and cross-organization requests.
- Verify duplicate, full, cancelled, and unpublished registration cases.
- Verify concurrent requests cannot overbook the final place.
- Add frontend tests for important forms and user-visible states.
- Resolve schema, API, and UI inconsistencies found during integration.

### Acceptance criteria

- [ ] The critical user journey works without manual database changes.
- [ ] Important positive and negative cases are automated.
- [ ] Authorization boundaries are verified.
- [ ] The final-place concurrency case is verified.
- [ ] Frontend and backend use consistent contracts and errors.
- [ ] Known limitations are documented.

### Depends on

- Issues 3, 4, and 5

---

## 7. Complete the development environment and CI configuration

**Suggested labels:** `midterm`, `devops`, `testing`, `documentation`

### Description

Make the public repository reproducible for other developers and automatically verify its basic quality checks.

### Tasks

- Add Docker Compose for PostgreSQL using a pinned supported major version.
- Complete safe frontend and backend `.env.example` files.
- Ensure secrets and local environment files are ignored.
- Update the README with:
  - Prerequisites
  - Dependency installation
  - Environment configuration
  - Database startup and shutdown
  - Migration, seed, and reset commands
  - Frontend and backend development commands
  - Lint, test, and build commands
  - Expected ports and URLs
- Add GitHub Actions for frontend and backend lint, tests, and production builds.
- Configure a PostgreSQL service for database tests where required.
- Add troubleshooting guidance for common port, environment, migration, and connection problems.
- Verify the instructions from a fresh clone.

### Acceptance criteria

- [ ] A developer can run the project using only the README.
- [ ] PostgreSQL starts reproducibly through Docker Compose.
- [ ] Environment examples contain no real secrets.
- [ ] CI runs for pull requests and fails when a required check fails.
- [ ] A fresh clone can run migrations, seed data, tests, and both applications.

### Depends on

- Issues 3 and 6

---

## 8. Write the mid-semester technical project document

**Suggested labels:** `midterm`, `documentation`, `architecture`

### Description

Assemble the required technical project document and ensure it matches the implemented application.

### Required sections

- Problem statement and project scope.
- High-level requirements.
- Actors and roles.
- Use cases.
- Main application workflows.
- User-research method and interview findings.
- Changes to initial assumptions resulting from interviews.
- Main product flows.
- High-level architecture and module responsibilities.
- ER diagram matching the implemented schema.
- Authentication and authorization model.
- Testing approach and known limitations.

### Tasks

- Consolidate the outputs of the requirements and UX issues.
- Add a high-level architecture diagram.
- Add an ER diagram that matches the committed migration.
- Explain the Next.js, NestJS, and PostgreSQL responsibilities.
- Document important technical decisions and trade-offs.
- Review all diagrams and descriptions against the current code.
- Use consistent terminology across the document and application.

### Acceptance criteria

- [ ] All documentation required by sections B and C of the milestone is present.
- [ ] Use cases and workflows match the implemented MVP.
- [ ] Architecture and ER diagrams match the repository.
- [ ] Technical decisions include their rationale and known limitations.
- [ ] The document is reviewed for consistency and clarity.

### Depends on

- Issues 1–7

---

## 9. Produce the GenAI Usage Report

**Suggested labels:** `midterm`, `documentation`, `genai`

### Description

Create the GenAI Usage Report required for the first part of the project. Report actual usage transparently and distinguish generated suggestions from human decisions.

### Tasks

- List the GenAI tools and models used.
- Explain the purpose of each meaningful use.
- Identify code, documentation, diagrams, tests, or decisions generated or modified with GenAI assistance.
- Explain how generated artifacts were reviewed and verified.
- Include examples where a human decision materially changed, rejected, or replaced an AI suggestion.
- Reference verification evidence such as tests, reviews, documentation, or official sources.
- Record known limitations or unresolved concerns.
- Have every team member review the entries describing their work.

### Acceptance criteria

- [ ] Tools/models and their purposes are documented.
- [ ] GenAI-assisted artifacts are identified.
- [ ] Human verification methods are explained.
- [ ] Concrete examples of material human changes or rejections are included.
- [ ] Every team member reviews and approves the report.
- [ ] No credentials, secrets, or unnecessary personal information are included.

### Depends on

- Record usage throughout Issues 1–8; finalize after the implementation and documentation work.

---

## 10. Prepare the individual contribution declarations

**Suggested labels:** `midterm`, `documentation`

### Description

Each team member must personally describe their contribution to the mid-semester delivery using repository evidence.

### Required content for each declaration

- Owned artifacts or workflows.
- Functionality implemented.
- Documentation produced.
- Tests written and verification performed.
- Architectural, technical, or product decisions contributed.
- User-research work performed, where applicable.
- GenAI-related work and human verification performed.
- References to relevant issues, commits, pull requests, or reviews.

### Acceptance criteria

- [ ] Every team member provides an individual declaration.
- [ ] Statements describe specific contributions rather than generic team activity.
- [ ] Claims are consistent with repository and issue history.
- [ ] Each declaration links to supporting evidence where possible.
- [ ] Each team member personally reviews and approves their declaration.

### Depends on

- Issues 1–9

---

## 11. Perform the mid-semester delivery review

**Suggested labels:** `midterm`, `release`

### Description

Review the completed work against sections A–E of the mid-semester milestone before submission.

### Checklist

- [ ] The repository is public and the submission link is correct.
- [ ] Project structure and development environment configuration are committed.
- [ ] The backend and frontend contain meaningful initial implementations.
- [ ] PostgreSQL configuration, migrations, initial data model, and seed data are committed.
- [ ] The main MVP workflows are demonstrable.
- [ ] The technical project document contains all required sections.
- [ ] The UX section includes interviews, findings, changed assumptions, and product flows.
- [ ] The GenAI Usage Report is complete and reviewed.
- [ ] Every individual contribution declaration is complete.
- [ ] A fresh-clone setup has been rehearsed successfully.
- [ ] Required lint, tests, and production builds pass.
- [ ] Known limitations and deferred features are documented.

### Depends on

- Issues 1–10

---

## Deferred until after the mid-semester milestone

The following features are not part of these issues:

- Attendance/check-in
- QR-code check-in
- Email or SMS notifications
- Analytics dashboards
- Calendar integrations
- Task assignment
- Waitlists
- Advanced recommendations
- Production hosting, unless it is explicitly required for the mid-semester submission
