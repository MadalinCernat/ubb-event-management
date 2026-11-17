"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "./api/client";
import type { EventView, Session } from "./api/types";
import { clearSession, setSession } from "./auth/session";
import type { FormState } from "./forms";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function errorState(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ApiError) {
    return { messages: error.messages, values };
  }
  // Unexpected errors bubble up to the nearest error boundary.
  throw error;
}

// Only allow internal, same-origin relative paths as redirect targets.
function safeReturnTo(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/events";
}

// --- Authentication -------------------------------------------------------

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData, "email");
  const returnTo = str(formData, "returnTo");
  let session: Session;
  try {
    session = await apiFetch<Session>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password: String(formData.get("password") ?? "") },
    });
  } catch (error) {
    return errorState(error, { email });
  }
  await setSession(session.accessToken);
  redirect(safeReturnTo(returnTo));
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData, "email");
  const displayName = str(formData, "displayName");
  const returnTo = str(formData, "returnTo");
  let session: Session;
  try {
    session = await apiFetch<Session>("/auth/register", {
      method: "POST",
      auth: false,
      body: {
        email,
        displayName,
        password: String(formData.get("password") ?? ""),
      },
    });
  } catch (error) {
    return errorState(error, { email, displayName });
  }
  await setSession(session.accessToken);
  redirect(safeReturnTo(returnTo));
}

export async function logoutAction(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Logout is best-effort; the client discards the token regardless.
  }
  await clearSession();
  redirect("/events");
}

// --- Organizations --------------------------------------------------------

export async function createOrganizationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = str(formData, "name");
  const description = str(formData, "description");
  try {
    await apiFetch("/organizations", {
      method: "POST",
      body: { name, description },
    });
  } catch (error) {
    return errorState(error, { name, description });
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- Events ---------------------------------------------------------------

function eventBody(formData: FormData) {
  return {
    title: str(formData, "title"),
    description: str(formData, "description"),
    location: str(formData, "location"),
    startsAt: str(formData, "startsAt"),
    endsAt: str(formData, "endsAt"),
    capacity: Number(formData.get("capacity")),
  };
}

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const organizationId = str(formData, "organizationId");
  const body = eventBody(formData);
  try {
    await apiFetch<EventView>(`/organizations/${organizationId}/events`, {
      method: "POST",
      body,
    });
  } catch (error) {
    return errorState(error, {
      organizationId,
      title: body.title,
      description: body.description,
      location: body.location,
    });
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const eventId = str(formData, "eventId");
  const body = eventBody(formData);
  try {
    await apiFetch<EventView>(`/events/${eventId}`, { method: "PATCH", body });
  } catch (error) {
    return errorState(error, {
      title: body.title,
      description: body.description,
      location: body.location,
    });
  }
  revalidatePath("/dashboard");
  revalidatePath(`/events/${eventId}`);
  redirect("/dashboard");
}

// Publish / cancel are rendered only when the transition is valid, so they
// simply revalidate; an unexpected conflict falls through to the error boundary.
export async function publishEventAction(formData: FormData): Promise<void> {
  const eventId = str(formData, "eventId");
  await apiFetch(`/events/${eventId}/publish`, { method: "POST" });
  revalidatePath("/dashboard");
  revalidatePath(`/events/${eventId}`);
}

export async function cancelEventAction(formData: FormData): Promise<void> {
  const eventId = str(formData, "eventId");
  await apiFetch(`/events/${eventId}/cancel`, { method: "POST" });
  revalidatePath("/dashboard");
  revalidatePath(`/events/${eventId}`);
}

// --- Registrations --------------------------------------------------------

export async function registerForEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const eventId = str(formData, "eventId");
  try {
    await apiFetch(`/events/${eventId}/registrations`, { method: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirect(`/login?returnTo=${encodeURIComponent(`/events/${eventId}`)}`);
    }
    return errorState(error);
  }
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my/registrations");
  return {};
}

export async function cancelRegistrationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const eventId = str(formData, "eventId");
  try {
    await apiFetch(`/events/${eventId}/registrations/me`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my/registrations");
  return {};
}
