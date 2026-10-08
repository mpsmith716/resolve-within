/**
 * Env-driven Better Auth config for Google / Apple sign-in (Better Auth 1.4.5).
 *
 * Each provider turns on only when ALL of its required env vars are set; otherwise it is
 * simply left out (sign-in/social then answers 404 PROVIDER_NOT_FOUND, as before) and
 * startup never fails. Values are never logged.
 *
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *     Google Cloud "Web application" OAuth client.
 *     Redirect URI: https://<backend host>/api/auth/callback/google
 *
 *   APPLE_CLIENT_ID      Apple Services ID (e.g. org.theresolvewithinproject.app.signin)
 *   APPLE_CLIENT_SECRET  ES256 client-secret JWT signed with the Sign in with Apple .p8 key.
 *                        Better Auth 1.4.5 has no team/key-id fields: the JWT must be
 *                        pre-generated (backend/scripts/generate-apple-client-secret.mjs)
 *                        and rotated before it expires (Apple max: ~6 months).
 *     Return URL: https://<backend host>/api/auth/callback/apple
 *   APPLE_APP_BUNDLE_IDENTIFIER (optional) iOS bundle ID; only used to verify ID tokens from
 *                        native Sign in with Apple (signIn.social({ idToken })). Not needed for
 *                        the browser redirect flow the app uses today.
 *
 *   AUTH_PUBLIC_BASE_URL (optional) public origin of this backend. When unset and a social
 *                        provider is enabled, Render's built-in RENDER_EXTERNAL_URL is used.
 *                        OAuth redirect_uri values are built from it, so it must be the public
 *                        https origin (the framework default resolves to http://localhost:3001).
 *                        With no social provider and no AUTH_PUBLIC_BASE_URL, baseURL is left to
 *                        the framework so deploying this change alone alters nothing.
 *                        Note: an https baseURL makes Better Auth use "__Secure-" cookie names;
 *                        existing app sessions keep working via the Bearer token.
 */

type Env = Record<string, string | undefined>;

function read(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function buildSocialProviders(env: Env = process.env): Record<string, any> {
  const providers: Record<string, any> = {};

  const googleClientId = read(env, "GOOGLE_CLIENT_ID");
  const googleClientSecret = read(env, "GOOGLE_CLIENT_SECRET");
  if (googleClientId && googleClientSecret) {
    providers.google = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // Let people with several Google accounts pick the right one.
      prompt: "select_account",
    };
  }

  const appleClientId = read(env, "APPLE_CLIENT_ID");
  const appleClientSecret = read(env, "APPLE_CLIENT_SECRET");
  if (appleClientId && appleClientSecret) {
    const appBundleIdentifier = read(env, "APPLE_APP_BUNDLE_IDENTIFIER");
    providers.apple = {
      clientId: appleClientId,
      clientSecret: appleClientSecret,
      ...(appBundleIdentifier ? { appBundleIdentifier } : {}),
      mapProfileToUser: appleDisplayName,
    };
  }

  return providers;
}

/**
 * Which social sign-in buttons the app should show. Derived from the same env checks as
 * buildSocialProviders, so a button only appears when the provider is actually enabled.
 * Exposes booleans only — never client ids or secrets.
 */
export function enabledAuthProviders(
  socialProviders: Record<string, unknown> = buildSocialProviders(),
): { google: boolean; apple: boolean } {
  return {
    google: Boolean(socialProviders.google),
    apple: Boolean(socialProviders.apple),
  };
}

/**
 * Better Auth 1.4.5 quirk: Apple posts the user's name only once, in the form_post body, but the
 * callback first redirects POST -> GET and then reads the name from the (now empty) body. The
 * provider then falls back to the email (often a private-relay address, sometimes the real one)
 * as `user.name`, which community posts display. Use a neutral display name instead.
 */
export function appleDisplayName(profile: { name?: unknown; email?: unknown }): { name?: string } {
  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  if (!name || name.includes("@") || name.includes("undefined")) return { name: "Member" };
  return {};
}

/** Public https origin used for OAuth redirect_uri, or undefined to keep the framework default. */
export function resolveAuthBaseURL(
  env: Env = process.env,
  socialProviders: Record<string, unknown> = buildSocialProviders(env),
): string | undefined {
  const hasSocial = Object.keys(socialProviders).length > 0;
  const raw = read(env, "AUTH_PUBLIC_BASE_URL") ?? (hasSocial ? read(env, "RENDER_EXTERNAL_URL") : undefined);
  if (!raw) return undefined;
  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

/** Origins that must be trusted for social sign-in (Apple posts the callback form from here). */
export const SOCIAL_TRUSTED_ORIGINS = ["https://appleid.apple.com"];
