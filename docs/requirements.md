# UBB Event Management — Mid-Semester Requirements

## 1. Problem statement

Student organizations need a simple way to publish events and manage participation, while students need one place to discover relevant events and register for them. Information and registrations are often distributed across social media, forms, and private messages, making event details difficult to find and participant lists difficult to manage.

UBB Event Management will provide a web application in which users can create organizations, organization managers can create and publish events, and students can discover and register for published events.

## 2. Project objectives

The mid-semester MVP must:

- provide email-and-password authentication;
- allow authenticated users to create organizations;
- assign the organization creator permission to manage that organization;
- allow authorized organization managers to create and manage events;
- allow visitors to discover published events;
- allow authenticated users to register for and cancel their own event registrations;
- persist application data in PostgreSQL;
- enforce validation, authorization, lifecycle, duplicate-registration, and capacity rules in the backend;
- provide an initial usable Next.js frontend connected to a NestJS REST API.

## 3. Mid-semester scope

### 3.1 Included functionality

- User registration with an email address and password.
- User sign-in, sign-out, and current-user identification.
- Organization creation.
- Organization membership and manager permissions.
- Event creation and editing.
- Event publication and cancellation.
- Public event listing, search, filtering, and event details.
- Event registration and cancellation by the registered user.
- Capacity enforcement and duplicate-registration prevention.
- PostgreSQL persistence through a migration-backed schema.
- Validation and consistent API errors.
- Initial automated tests for the main workflows and business rules.

### 3.2 Deferred functionality

The following functionality is outside the mid-semester MVP:

- attendance and check-in;
- QR-code check-in;
- email or SMS notifications;
- analytics dashboards;
- calendar integrations;
- task assignment;
- waitlists;
- advanced recommendations;
- system-administrator and moderation functionality;
- institutional-email-only registration;
- production hosting unless explicitly required for the submission.

## 4. Assumptions and decisions

- Any valid email address may be used. An institutional UBB email address is not required by the current project plan.
- Email addresses are compared using a normalized form and must be unique.
- Passwords are never stored as plaintext; only secure password hashes are persisted.
- An authenticated user may create an organization.
- The creator of an organization becomes its initial manager.
- Any authenticated user may register for any published event that has not started and has available capacity.
- A user may cancel their own active registration before the event starts.
- Dates and times are stored in UTC and rendered in the user's local timezone. The mid-semester demo defaults to `Europe/Bucharest`.
- Important business rules are enforced by the NestJS backend even when the frontend performs equivalent checks for usability.

## 5. Actors and roles

### 5.1 Visitor

An unauthenticated user.

May:

- browse published events;
- search and filter published events;
- view published event details;
- create an account;
- sign in.

May not:

- create an organization;
- create or manage events;
- register for an event;
- access private organization or participant information.

### 5.2 Authenticated user / student

A signed-in user of the application.

May:

- perform all visitor actions;
- create an organization;
- register for an eligible published event;
- view and cancel their own active registrations before an event starts.

May not:

- manage an organization or event without the required membership role;
- view another user's private registration information.

### 5.3 Organization member

An authenticated user who belongs to an organization but does not have manager permissions.

May:

- view information made available to organization members;
- perform the normal actions of an authenticated user.

May not:

- create, edit, publish, or cancel organization events unless promoted to manager.

### 5.4 Organization manager / event organizer

An authenticated user with management permission for an organization. An organization's creator receives this role automatically.

May:

- create events for the managed organization;
- edit the organization's events;
- publish eligible draft events;
- cancel the organization's events.

May not:

- manage an unrelated organization or its events.

## 6. Event model and lifecycle

### 6.1 Required event information

An event contains:

- organization;
- title;
- description;
- location;
- start date and time;
- end date and time;
- capacity;
- lifecycle status;
- creator;
- creation and update timestamps.

The title, description, location, start time, end time, capacity, organization, and creator are required.

### 6.2 Validation rules

- The title, description, and location must not be blank.
- The end time must be later than the start time.
- Capacity must be a positive integer.
- Only a manager of the event's organization may create or manage the event.
- An event cannot accept registrations unless it is published and has not started.

### 6.3 Lifecycle states

- `DRAFT`: visible only to authorized organization users and still editable.
- `PUBLISHED`: publicly discoverable and eligible for registration.
- `CANCELLED`: no longer eligible for registration and clearly displayed as cancelled where authorized users can view it.

### 6.4 Allowed transitions

- A newly created event starts as `DRAFT`.
- `DRAFT` may transition to `PUBLISHED` after validation succeeds.
- `DRAFT` may transition to `CANCELLED`.
- `PUBLISHED` may transition to `CANCELLED`.
- `CANCELLED` is terminal during the mid-semester MVP.
- A published or cancelled event cannot return to draft during the mid-semester MVP.

## 7. Functional requirements

### FR-01 — Register an account

The system shall allow a visitor to create an account using a unique valid email address and password.

### FR-02 — Authenticate a user

The system shall allow a registered user to sign in and sign out and shall identify the current user for protected requests.

### FR-03 — Create an organization

The system shall allow an authenticated user to create an organization and shall assign that user as the initial organization manager.

### FR-04 — Enforce organization permissions

The system shall allow organization-management and event-management actions only when the current user has the required role for the target organization.

### FR-05 — Create an event

The system shall allow an organization manager to create a draft event for an organization they manage.

### FR-06 — Edit an event

The system shall allow an authorized organization manager to edit an eligible event while enforcing event validation and lifecycle rules.

### FR-07 — Publish an event

The system shall allow an authorized organization manager to publish a valid draft event.

### FR-08 — Cancel an event

The system shall allow an authorized organization manager to cancel a draft or published event.

### FR-09 — Discover published events

The system shall allow visitors and authenticated users to browse published events and search or filter them by free text, date, and organization.

### FR-10 — View event details

The system shall provide a public detail view for a published event without exposing private participant information.

### FR-11 — Register for an event

The system shall allow an authenticated user to register for a published event that has not started and has available capacity.

### FR-12 — Prevent invalid registration

The system shall reject registration when the event is not published, is cancelled, has started, is full, or already has an active registration for the current user.

### FR-13 — Cancel own registration

The system shall allow an authenticated user to cancel their own active registration before the event starts.

### FR-14 — Protect event capacity

The system shall enforce capacity safely when registrations are submitted concurrently so that the number of active registrations cannot exceed event capacity.

### FR-15 — Persist data

The system shall persist users, organizations, memberships, events, and registrations in PostgreSQL through committed schema migrations.

### FR-16 — Provide useful errors

The API shall return consistent validation, authentication, authorization, not-found, conflict, and server-error responses without exposing sensitive implementation details.

## 8. Non-functional requirements

### NFR-01 — Security

- Passwords must be stored using a suitable password-hashing algorithm.
- Authentication secrets and database credentials must not be committed to source control or exposed to the browser.
- Authorization must be enforced by the backend.
- Sensitive credentials, password hashes, and tokens must not be logged.

### NFR-02 — Data integrity

- PostgreSQL foreign keys and unique constraints must protect important relationships and invariants.
- Schema changes must use committed migrations.
- Duplicate active registrations and memberships must be prevented.
- Capacity enforcement must be concurrency-safe.

### NFR-03 — Validation

- External input must be validated at the API boundary.
- The frontend should provide immediate helpful validation, but frontend validation must not replace backend validation.

### NFR-04 — Usability and accessibility

- Main workflows must be completable through the UI without manual database changes.
- Forms must have visible labels and understandable error feedback.
- Main actions must be keyboard accessible.
- Pages must provide loading, empty, success, validation, authorization, and server-error states.
- The initial UI must be usable on desktop and narrow mobile viewports.

### NFR-05 — Maintainability

- The backend must separate controllers, services, data access, and shared concerns.
- Business-critical rules must not be implemented only in controllers or frontend components.
- API routes, DTOs, status codes, and error shapes must follow consistent conventions.

### NFR-06 — Testability

- Critical business rules must have automated tests.
- The main integrated workflow must have at least one API, integration, or browser-level automated test.
- Authentication and authorization denial cases must be tested.

### NFR-07 — Reproducibility

- A developer must be able to configure and run the project from a fresh clone using documented commands.
- Safe environment-variable examples must be provided.
- The database must be reproducible using Docker and committed migrations.

## 9. Use cases

### UC-01 — Create an account

**Primary actor:** Visitor  
**Preconditions:** The visitor is not signed in.

**Main flow:**

1. The visitor opens the registration page.
2. The visitor enters an email address and password.
3. The system validates the input and verifies that the normalized email is unused.
4. The system hashes the password and creates the account.
5. The system confirms success and allows the user to sign in or creates the agreed authenticated session.

**Alternative flows:**

- Invalid input is rejected with field-level feedback.
- An existing email is rejected without exposing sensitive account information.

### UC-02 — Sign in

**Primary actor:** Registered user  
**Preconditions:** The user has an account.

**Main flow:**

1. The user enters their email address and password.
2. The backend validates the credentials.
3. The system establishes the authenticated state.
4. The frontend displays the authenticated user's available actions.

**Alternative flow:** Invalid credentials are rejected without identifying which credential was incorrect.

### UC-03 — Create an organization

**Primary actor:** Authenticated user  
**Preconditions:** The user is signed in.

**Main flow:**

1. The user enters the organization's required information.
2. The backend validates the request.
3. The system creates the organization and a manager membership for the creator.
4. The organization becomes available in the user's organization context.

### UC-04 — Create and publish an event

**Primary actor:** Organization manager  
**Preconditions:** The user is signed in and manages the selected organization.

**Main flow:**

1. The manager opens the event-management interface.
2. The manager enters the required event information.
3. The backend validates permissions and event data.
4. The system stores the event as a draft.
5. The manager requests publication.
6. The backend validates the event and lifecycle transition.
7. The system marks the event as published.
8. The event becomes publicly discoverable.

**Alternative flows:**

- Invalid data is rejected with useful validation errors.
- A user without permission receives `403 Forbidden`.
- An unauthenticated request receives `401 Unauthorized`.
- An illegal lifecycle transition is rejected.

### UC-05 — Discover an event

**Primary actor:** Visitor or authenticated user  
**Preconditions:** At least one event is published.

**Main flow:**

1. The user opens the event listing.
2. The system displays published events.
3. The user optionally searches or filters by text, date, or organization.
4. The user opens an event detail page.
5. The system displays public event information and current availability.

### UC-06 — Register for an event

**Primary actor:** Authenticated user  
**Preconditions:** The event is published, has not started, and has available capacity.

**Main flow:**

1. The user opens the event detail page.
2. The user requests registration.
3. The backend verifies identity, event status, start time, duplicate-registration status, and capacity.
4. The system creates the registration atomically.
5. The frontend displays confirmation.

**Alternative flows:**

- An unauthenticated user is asked to sign in.
- A duplicate registration is rejected.
- A full, cancelled, unpublished, or started event is rejected.
- A concurrent request that loses the final available place is rejected without overbooking.

### UC-07 — Cancel own registration

**Primary actor:** Registered participant  
**Preconditions:** The user has an active registration and the event has not started.

**Main flow:**

1. The user requests cancellation of their registration.
2. The backend verifies ownership and cancellation eligibility.
3. The system marks or removes the active registration according to the selected persistence strategy.
4. The frontend confirms the cancellation and updates availability.

**Alternative flows:** A user cannot cancel another user's registration or cancel after the event starts.

## 10. Main application workflows and acceptance criteria

### Workflow A — Authenticate and authorize organization actions

1. A visitor creates an account or a registered user signs in.
2. The authenticated user creates an organization or accesses an existing membership.
3. The backend resolves the user's identity and organization role for protected requests.
4. Authorized actions continue; unauthorized actions return a consistent error.

**Acceptance criteria:**

- [ ] A visitor can create an account with a unique valid email and password.
- [ ] A registered user can sign in and sign out.
- [ ] An authenticated user can create an organization and becomes its manager.
- [ ] An unauthenticated protected request returns `401 Unauthorized`.
- [ ] An authenticated user without the required role receives `403 Forbidden`.
- [ ] A manager cannot manage an unrelated organization or its events.

### Workflow B — Create and publish an event

1. An organization manager opens the event-management interface.
2. The manager creates a valid draft event.
3. The manager may edit the draft.
4. The manager publishes the event.
5. The published event appears in public discovery.
6. The manager may cancel the draft or published event.

**Acceptance criteria:**

- [ ] An authorized manager can create and edit a draft event through the UI.
- [ ] An event with an end time at or before its start time is rejected.
- [ ] An event with non-positive capacity is rejected.
- [ ] A valid draft can be published.
- [ ] A published event becomes publicly discoverable.
- [ ] A draft or published event can be cancelled by an authorized manager.
- [ ] Illegal lifecycle transitions are rejected.
- [ ] Event data persists in PostgreSQL.

### Workflow C — Discover and register for an event

1. A visitor browses, searches, or filters published events.
2. The visitor opens the event detail page.
3. The user signs in if registration is requested while unauthenticated.
4. The authenticated user registers if eligible and capacity is available.
5. The user receives registration confirmation.
6. The user may cancel their own registration before the event starts.

**Acceptance criteria:**

- [ ] Only published events appear in public discovery.
- [ ] Events can be searched by free text and filtered by date or organization.
- [ ] Public event responses contain no private participant information.
- [ ] An eligible authenticated user can register successfully.
- [ ] Duplicate registration is rejected.
- [ ] Full, cancelled, unpublished, and started events reject registration.
- [ ] Concurrent registration requests cannot exceed event capacity.
- [ ] A user can cancel their own active registration before the event starts.
- [ ] A user cannot cancel another user's registration.

## 11. Open review item

- Confirm that all team members agree with this scope, terminology, and the stated business rules before implementation is treated as final.
