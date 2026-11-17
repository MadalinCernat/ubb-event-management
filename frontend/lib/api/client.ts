import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "../auth/constants";

// Thrown for any non-2xx backend response. `messages` always holds at least one
// human-readable string (the backend returns `message` as a string or a string[]).
export class ApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(statusCode: number, messages: string[]) {
    super(messages[0] ?? "Request failed");
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.messages = messages.length > 0 ? messages : ["Request failed"];
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // When true (default) the caller's bearer token from the session cookie is attached.
  auth?: boolean;
}

function baseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:3001";
}

/**
 * Single place the frontend talks to the NestJS API. Runs only on the server so
 * the base URL and bearer token are never exposed to the browser (BFF pattern,
 * see docs/adr/0001-authentication.md).
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? (data as { message: unknown }).message
        : undefined;
    const messages = Array.isArray(message)
      ? message.map(String)
      : [typeof message === "string" ? message : "Request failed"];
    throw new ApiError(response.status, messages);
  }

  return data as T;
}
