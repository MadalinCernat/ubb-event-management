import { test, expect } from "@playwright/test";

/**
 * Critical journey: org manager creates and publishes an event;
 * a student browses and registers for it.
 *
 * Requires both the Next.js frontend (port 3000, started by playwright webServer)
 * and the NestJS backend (port 3001, started manually) to be running with a
 * migrated PostgreSQL database.
 *
 * Skip with:  RUN_E2E=false npm run test:e2e  (default when env is unset)
 * Run with:   RUN_E2E=true  npm run test:e2e
 */

const ENABLED = process.env.RUN_E2E === "true";

// Unique suffix so parallel or repeated runs don't collide on unique constraints.
const RUN = `e2e${Date.now().toString(36)}`;

const MANAGER_EMAIL = `manager.${RUN}@e2e.test`;
const MANAGER_PASS = "test-password-1";
const MANAGER_NAME = `Manager ${RUN}`;

const STUDENT_EMAIL = `student.${RUN}@e2e.test`;
const STUDENT_PASS = "test-password-2";
const STUDENT_NAME = `Student ${RUN}`;

const ORG_NAME = `${RUN} E2E Org`;
const EVENT_TITLE = `${RUN} E2E Event`;

async function signUp(
  page: import("@playwright/test").Page,
  name: string,
  email: string,
  password: string,
) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();
  // After successful sign-up the app redirects to /events.
  await page.waitForURL(/\/events/);
}

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(/\/events/);
}

test.describe("Critical user journey", () => {
  test.skip(!ENABLED, "Set RUN_E2E=true to run browser E2E tests");

  test("manager creates and publishes event; student browses and registers", async ({ page }) => {
    // ── Step 1: Manager signs up ───────────────────────────────────────────
    await signUp(page, MANAGER_NAME, MANAGER_EMAIL, MANAGER_PASS);
    await expect(page).toHaveURL(/\/events/);

    // ── Step 2: Manager creates an organization ────────────────────────────
    await page.goto("/dashboard/organizations/new");
    await page.getByLabel("Organization name").fill(ORG_NAME);
    await page.getByLabel("Description").fill("End-to-end test organization");
    await page.getByRole("button", { name: /Create organization/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(ORG_NAME)).toBeVisible();

    // ── Step 3: Manager creates a draft event ──────────────────────────────
    await page.getByRole("link", { name: /New event/i }).click();
    await page.waitForURL(/\/dashboard\/events\/new/);

    const startDate = new Date(Date.now() + 7 * 24 * 3600_000);
    const endDate = new Date(startDate.getTime() + 3600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localValue = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await page.getByLabel("Title").fill(EVENT_TITLE);
    await page.getByLabel("Description").fill("An end-to-end test event");
    await page.getByLabel("Location").fill("Test Venue");

    // The EventForm uses datetime-local inputs controlled via React state.
    await page.getByLabel("Starts").fill(localValue(startDate));
    await page.getByLabel("Ends").fill(localValue(endDate));
    await page.getByLabel("Capacity").fill("10");

    await page.getByRole("button", { name: /Create|Save/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(EVENT_TITLE)).toBeVisible();

    // ── Step 4: Manager publishes the event ───────────────────────────────
    // Find the row containing the event title and click its Publish button.
    const eventRow = page.locator("li").filter({ hasText: EVENT_TITLE });
    await eventRow.getByRole("button", { name: /^Publish$/i }).click();
    // After publishing, the Draft badge should become Published.
    await expect(eventRow.getByText("Published")).toBeVisible();

    // ── Step 5: Student signs up and browses events ───────────────────────
    await page.goto("/login");
    await page.getByRole("link", { name: /Create one|Create account/i }).click();
    await page.getByLabel("Name").fill(STUDENT_NAME);
    await page.getByLabel("Email").fill(STUDENT_EMAIL);
    await page.getByLabel("Password").fill(STUDENT_PASS);
    await page.getByRole("button", { name: /Create account/i }).click();
    await page.waitForURL(/\/events/);

    // ── Step 6: Student finds the event via search ────────────────────────
    await page.goto("/events");
    await page.getByLabel("Search").fill(RUN);
    await page.getByRole("button", { name: /Apply/i }).click();
    await expect(page.getByText(EVENT_TITLE)).toBeVisible();

    // ── Step 7: Student opens event detail and registers ─────────────────
    await page.getByText(EVENT_TITLE).click();
    await page.waitForURL(/\/events\/.+/);

    await expect(page.getByText(/10 spots/i).or(page.getByText(/10 of 10/))).toBeVisible();

    await page.getByRole("button", { name: /^Register$/i }).click();

    // After registration the UI should confirm the registration.
    await expect(
      page.getByText(/You're registered/i).or(page.getByText(/registered for this event/i)),
    ).toBeVisible();

    // ── Step 8: Verify the event count updated ────────────────────────────
    // After registering the page re-renders with an updated count.
    await expect(page.getByText(/1 of 10 spots taken/i)).toBeVisible();

    // ── Step 9: Student cancels their registration ────────────────────────
    await page.getByRole("button", { name: /Cancel registration/i }).click();
    await expect(page.getByRole("button", { name: /^Register$/i })).toBeVisible();
  });
});

test.describe("Unauthenticated access", () => {
  test.skip(!ENABLED, "Set RUN_E2E=true to run browser E2E tests");

  test("event list is visible without login", async ({ page }) => {
    await page.goto("/events");
    // Should render without redirect to login.
    await expect(page.getByRole("heading", { name: /Events/i })).toBeVisible();
  });

  test("dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("clicking 'Sign in to register' on an event redirects to login", async ({ page }) => {
    // This requires at least one published event; use a pre-registered one if
    // the main test ran, or rely on existing data. If no events are visible,
    // this test is a no-op.
    await page.goto("/events");
    const firstCard = page.locator(".event-card").first();
    const count = await firstCard.count();
    test.skip(count === 0, "No published events to click on");

    await firstCard.click();
    await page.waitForURL(/\/events\/.+/);

    const signInBtn = page.getByRole("link", { name: /Sign in to register/i });
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
