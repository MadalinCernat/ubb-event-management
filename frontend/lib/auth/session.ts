import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "../api/client";
import type { Me } from "../api/types";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";

export async function setSession(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function hasSession(): Promise<boolean> {
  return Boolean((await cookies()).get(SESSION_COOKIE)?.value);
}

// Returns the current user, or null when there is no valid session.
export async function getCurrentUser(): Promise<Me | null> {
  if (!(await hasSession())) {
    return null;
  }
  try {
    return await apiFetch<Me>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }
    throw error;
  }
}

// For protected pages: redirects to the sign-in page when not authenticated.
export async function requireUser(returnTo: string): Promise<Me> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export function isManager(user: Me | null): boolean {
  return Boolean(user?.memberships.some((m) => m.role === "MANAGER"));
}
