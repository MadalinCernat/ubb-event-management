export const SESSION_COOKIE = "session";

// The bearer token lifetime from the backend is 1 hour (see docs/adr/0001-authentication.md).
export const SESSION_MAX_AGE_SECONDS = 60 * 60;
