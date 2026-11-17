# UBB Event Management — Mid-Semester Technical Project Document

This document is the entry point for the mid-semester documentation package. The linked documents are part of the same technical submission and should be submitted or exported together.

## 1. Problem statement and project scope

The problem statement, project objectives, included MVP scope, deferred functionality, assumptions, and decisions are documented in:

- [`requirements.md` — sections 1–4](./requirements.md)

## 2. High-level requirements

The functional requirements (`FR-01` through `FR-16`) and non-functional requirements (`NFR-01` through `NFR-07`) are documented in:

- [`requirements.md` — sections 6–8](./requirements.md)
- [`traceability.md`](./traceability.md), which links requirements to endpoints and tests

## 3. Actors and roles

The visitor, authenticated user/student, organization member, and organization manager/event organizer roles and their permissions are documented in:

- [`requirements.md` — section 5](./requirements.md)

## 4. Use cases

The following use cases are documented with actors, preconditions, main flows, and relevant alternative flows:

- Create an account
- Sign in
- Create an organization
- Create and publish an event
- Discover an event
- Register for an event
- Cancel an event registration

See:

- [`requirements.md` — section 9](./requirements.md)

## 5. Main application workflows

The technical requirements document defines three main workflows and their acceptance criteria:

1. Authenticate and authorize organization actions.
2. Create and publish an event.
3. Discover and register for an event.

See:

- [`requirements.md` — section 10](./requirements.md)
- [`product-flows.md`](./product-flows.md) for detailed product flows and low-fidelity wireframes

## 6. UX and user research

The user-research material contains the interview questions, anonymized answers, findings, and changes to the team's initial assumptions:

- [`user-research.md`](./user-research.md)
- [`product-flows.md`](./product-flows.md)

## 7. Supporting technical documentation

- [`api.md`](./api.md) — API conventions, endpoints, and business rules
- [`adr/0001-authentication.md`](./adr/0001-authentication.md) — authentication decision
- [`traceability.md`](./traceability.md) — requirement-to-implementation/test mapping
- [`known-limitations.md`](./known-limitations.md) — known constraints and deferred improvements

## 8. GenAI declaration

- [`genai-usage-report.md`](./genai-usage-report.md)

The report must be personally reviewed by all three students before submission.

## 9. Individual contribution declarations

- [`individual-contributions.md`](./individual-contributions.md)

Each student must personally review and approve their own declaration before submission.

## Submission readiness

- [x] Problem statement and scope are documented.
- [x] High-level requirements are documented.
- [x] Actors and roles are documented.
- [x] Use cases are documented.
- [x] Main application workflows are documented.
- [x] User research, findings, changed assumptions, and product flows are documented.
- [x] All GenAI entries have been completed and personally reviewed.
- [x] All individual contribution declarations have been personally reviewed and approved.
