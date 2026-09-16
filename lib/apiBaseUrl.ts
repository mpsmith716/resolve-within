import Constants from "expo-constants";

/** Specular production fallback — keep in sync with app.json expo.extra.backendUrl */
export const DEFAULT_API_URL =
  "https://bcbpzb8nm7j2wkh7vmms5j4hf6m3be9b.app.specular.dev";

/**
 * Resolve backend API base URL in order:
 * 1) EXPO_PUBLIC_API_URL (non-empty after trim)
 * 2) Constants.expoConfig.extra.backendUrl (non-empty string)
 * 3) DEFAULT_API_URL (Specular)
 *
 * Never returns an empty string; throws if somehow all sources are empty.
 */
export function resolveApiBaseUrl(
  envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  extraUrl: unknown = Constants.expoConfig?.extra?.backendUrl
): string {
  const fromEnv = typeof envUrl === "string" ? envUrl.trim() : "";
  if (fromEnv.length > 0) {
    return fromEnv;
  }

  const fromExtra = typeof extraUrl === "string" ? extraUrl.trim() : "";
  if (fromExtra.length > 0) {
    return fromExtra;
  }

  if (DEFAULT_API_URL.trim().length > 0) {
    return DEFAULT_API_URL;
  }

  throw new Error(
    "API base URL is not configured: set EXPO_PUBLIC_API_URL, expo.extra.backendUrl, or DEFAULT_API_URL."
  );
}

/** Single source of truth for auth and API clients (evaluated at module load). */
export const API_BASE_URL = resolveApiBaseUrl();
