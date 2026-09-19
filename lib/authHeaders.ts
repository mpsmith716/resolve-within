/**
 * Build headers for authenticated API calls.
 *
 * Better Auth Expo stores the session cookie jar via expoClient (SecureStore).
 * Staging also accepts Authorization: Bearer <session token> (raw or signed).
 * Prefer Cookie (documented Expo path); include Bearer when present.
 */
export function buildAuthenticatedHeaders(options: {
  cookie?: string | null;
  bearerToken?: string | null;
  extra?: Record<string, string>;
}): Record<string, string> {
  const headers: Record<string, string> = { ...(options.extra ?? {}) };

  const cookie = typeof options.cookie === "string" ? options.cookie.trim() : "";
  if (cookie.length > 0) {
    headers.Cookie = cookie;
  }

  const bearer =
    typeof options.bearerToken === "string" ? options.bearerToken.trim() : "";
  if (bearer.length > 0) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  return headers;
}

export function hasAuthCredential(headers: Record<string, string>): boolean {
  return Boolean(headers.Cookie || headers.Authorization);
}

/**
 * Extract session token from Better Auth email sign-in / sign-up JSON body.
 * Email endpoints return `{ token, user }`; some paths nest `session.token`.
 */
export function extractSessionToken(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.token === "string" && record.token.length > 0) {
    return record.token;
  }

  const session = record.session;
  if (session && typeof session === "object") {
    const nested = (session as Record<string, unknown>).token;
    if (typeof nested === "string" && nested.length > 0) {
      return nested;
    }
  }

  return null;
}
