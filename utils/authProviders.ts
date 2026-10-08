export interface AuthProviders {
  google: boolean;
  apple: boolean;
}

/** Shown when the server can't be reached: hide social buttons rather than show a broken one. */
export const NO_SOCIAL_PROVIDERS: AuthProviders = { google: false, apple: false };

export const AUTH_PROVIDERS_TIMEOUT_MS = 5000;

/** Accept only an object with boolean flags; anything else means "hide the buttons". */
export function parseAuthProviders(value: unknown): AuthProviders {
  if (!value || typeof value !== 'object') return NO_SOCIAL_PROVIDERS;
  const v = value as Record<string, unknown>;
  return { google: v.google === true, apple: v.apple === true };
}

let cached: AuthProviders | null = null;

/** Last successful answer this session (lets a re-opened sign-in screen render instantly). */
export function getCachedAuthProviders(): AuthProviders | null {
  return cached;
}

/**
 * Ask the backend at `baseUrl` (API_BASE_URL) which social sign-in providers are enabled
 * (GET /api/auth-providers).
 * Resolves to all-false on timeout, network error, non-200 or a malformed body. Never throws.
 */
export async function fetchAuthProviders(
  baseUrl: string,
  timeoutMs: number = AUTH_PROVIDERS_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch
): Promise<AuthProviders> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort();
        reject(new Error('auth-providers timeout'));
      }, timeoutMs);
    });
    const response = (await Promise.race([
      fetchImpl(`${baseUrl}/api/auth-providers`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      }),
      timeout,
    ])) as Response;
    if (!response.ok) return NO_SOCIAL_PROVIDERS;
    const providers = parseAuthProviders(await response.json());
    cached = providers;
    return providers;
  } catch (error: any) {
    console.warn('[Auth] Could not load sign-in providers:', error?.message || error);
    return NO_SOCIAL_PROVIDERS;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
