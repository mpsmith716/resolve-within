# Google + Apple sign-in setup (Render backend, Better Auth 1.4.5)

No secrets in this file. Never paste client secrets, `.p8` keys, or the Apple JWT into chat, logs, or git.

## How sign-in works in this app
- Mobile (`contexts/AuthContext.tsx` `signInWithSocial`) calls `authClient.signIn.social({ provider, callbackURL: "resolvewithin://auth-callback" })`.
  `@better-auth/expo` opens the provider in the system browser (Custom Tab / ASWebAuthenticationSession) via
  `/api/auth/expo-authorization-proxy`, the provider redirects to the **backend** callback, and the backend redirects to
  `resolvewithin://auth-callback?cookie=…`. Browser redirect only, no native SDKs, no ID tokens.
- So Google needs only a **Web application** OAuth client, and Apple needs only a **Services ID** + key.
  No Android/iOS Google clients and no SHA-1 fingerprints.
- `app/auth.tsx` shows **Sign In with Apple on iOS only** and Google on all platforms. That covers App Store Guideline 4.8 (iOS offers Apple next to Google).
  The Apple button is not needed on Android.
- Each button appears **only when the backend has that provider enabled**: the sign-in screen calls the public
  `GET /api/auth-providers` (returns `{ "google": bool, "apple": bool }` from the same env checks as
  `backend/src/auth-social.ts`, booleans only) with a 5 s timeout, and hides both buttons on any failure.
  So Apple stays hidden until the `APPLE_*` env vars are set on Render, then appears without an app update.
  Note: Guideline 4.8 means that once Google is shown on iOS, Apple must be configured before App Store review.

## Fixed values
| Item | Value |
|---|---|
| Backend origin | `https://resolve-within-backend.onrender.com` |
| Google redirect URI | `https://resolve-within-backend.onrender.com/api/auth/callback/google` |
| Apple return URL | `https://resolve-within-backend.onrender.com/api/auth/callback/apple` |
| App deep link (callbackURL) | `resolvewithin://auth-callback` (already trusted) |
| iOS bundle / App ID | `org.theresolvewithinproject.app` |
| Apple Services ID (client_id) | `org.theresolvewithinproject.app.signin` |
| Apple Team ID | `BLXJ5X69U3` |

## Google Cloud (console.cloud.google.com → Google Auth Platform)
1. Select or create the project "Resolve Within".
2. **Get started / Branding**: App name `Resolve Within`; User support email `mpsmith716@gmail.com`; Audience **External**;
   Developer contact `mpsmith716@gmail.com`. Leave the logo empty (a logo triggers brand verification). Home page and privacy URL are optional.
   **Authorized domains**: add `resolve-within-backend.onrender.com`. `onrender.com` is a public suffix, so the full host is required.
3. **Data Access** → Add or remove scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (all non-sensitive) → Save.
4. **Audience** → Publishing status → **Publish app** → status *In production*. These scopes don't need verification.
   In *Testing* mode, only listed test users can sign in.
5. **Clients** → Create client → **Web application**, name `Resolve Within backend (Better Auth)`.
   - Authorized JavaScript origins: `https://resolve-within-backend.onrender.com` (harmless, not strictly needed)
   - Authorized redirect URIs: `https://resolve-within-backend.onrender.com/api/auth/callback/google` (exact, no trailing slash)
   - Create. Copy the Client ID and **Client secret now**: Google shows the secret only once (download the JSON).
6. Do **not** create Android or iOS OAuth clients.

## Apple Developer (developer.apple.com/account)
0. If the account page shows an updated Program License Agreement, the Account Holder must accept it first. Until then, creating identifiers and keys is blocked.
1. **Identifiers → App IDs** → `org.theresolvewithinproject.app`. If it's missing, create it: App, Explicit, description `Resolve Within`.
   Enable **Sign In with Apple** → *Enable as a primary App ID* → Save → Confirm.
2. **Identifiers → + → Services IDs**: Description `Resolve Within`, Identifier `org.theresolvewithinproject.app.signin` → Register.
   Open it → check **Sign In with Apple** → Configure → Primary App ID `org.theresolvewithinproject.app` →
   Domains `resolve-within-backend.onrender.com` → Return URLs `https://resolve-within-backend.onrender.com/api/auth/callback/apple`
   → Next → Done → Continue → **Save**. No domain-verification file is needed.
3. **Keys → +**: name `Resolve Within Sign in with Apple`, check **Sign in with Apple** → Configure → primary App ID `org.theresolvewithinproject.app`
   → Save → Continue → Register → **Download `AuthKey_<KEYID>.p8` (one-time download)** and note the 10-character Key ID.
4. Generate the client secret JWT (Better Auth 1.4.5 needs a pre-signed JWT, not team/key fields):
   ```bash
   mkdir -p /workspace/secrets/resolve-within-apple && chmod 700 /workspace/secrets/resolve-within-apple
   mv <browser-download-dir>/AuthKey_<KEYID>.p8 /workspace/secrets/resolve-within-apple/ && chmod 600 /workspace/secrets/resolve-within-apple/AuthKey_<KEYID>.p8
   node /workspace/resolve-within/backend/scripts/generate-apple-client-secret.mjs \
     --team-id BLXJ5X69U3 --key-id <KEYID> \
     --client-id org.theresolvewithinproject.app.signin \
     --key-file /workspace/secrets/resolve-within-apple/AuthKey_<KEYID>.p8
   # -> writes /workspace/secrets/resolve-within-apple/apple-client-secret.jwt (mode 600), prints only non-secret claims + expiry
   ```
   It expires in 180 days (Apple's max is about 182 days). Rerun it and update Render before the printed expiry.
5. App config: `app.json` → `ios.entitlements["com.apple.developer.applesignin"] = ["Default"]`. EAS Build syncs capabilities
   and would otherwise **disable** Sign in with Apple on the App ID at the next iOS build, which breaks the Services ID's primary App ID.

## Render (service `resolve-within-backend` → Environment)
| Variable | Value / source |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Web client → Client ID (`…apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Google Web client → Client secret (secret) |
| `APPLE_CLIENT_ID` | `org.theresolvewithinproject.app.signin` |
| `APPLE_CLIENT_SECRET` | contents of `apple-client-secret.jwt` (secret, one line) |
| `APPLE_APP_BUNDLE_IDENTIFIER` | *optional, leave unset*; only for future native ID-token sign-in (`org.theresolvewithinproject.app`) |
| `AUTH_PUBLIC_BASE_URL` | *optional, leave unset*; code falls back to Render's automatic `RENDER_EXTERNAL_URL` |

A provider turns on only when both its ID and secret are set. Missing vars leave it off (404 `PROVIDER_NOT_FOUND`), and startup never fails.

### Verify after deploy (read-only)
- `curl -s https://resolve-within-backend.onrender.com/api/auth-providers` shows which buttons the app will display.
- Logs: `[auth] Social sign-in configuration` should show `socialProviders: ["google","apple"]` and `authBaseURL: "https://resolve-within-backend.onrender.com"`.
- `curl -sI https://resolve-within-backend.onrender.com/api/auth/callback/google | grep -i location` should start with
  `https://resolve-within-backend.onrender.com/api/auth/error`. Before this change it was `http://localhost:3001/...`, which would break every OAuth redirect_uri.
  If it still says localhost, check Render for a `BETTER_AUTH_URL` env var and set `AUTH_PUBLIC_BASE_URL=https://resolve-within-backend.onrender.com`.

## Known quirks
- Better Auth 1.4.5 drops Apple's first/last name: Apple sends it once in a form POST, and Better Auth reads it after a POST→GET redirect.
  The code sets the display name to `Member` instead of falling back to the user's email, since community posts show `user.name`.
- Switching baseURL to https makes Better Auth use `__Secure-` cookie names. Existing app sessions keep working through the Bearer token.
