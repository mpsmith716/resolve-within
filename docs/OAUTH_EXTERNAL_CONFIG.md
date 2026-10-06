# Production OAuth — External Config Checklist

In-repo scheme remains `resolvewithin`. Production package/bundle IDs are now:
`org.theresolvewithinproject.app`.

> **App ID change (Oct 2026):** the package/bundle ID moved from the old `com.cypherwavestudios.resolvewithin`
> to `org.theresolvewithinproject.app` so Resolve Within is brand- and legally separate from the owner's LLC
> (it is becoming its own not-for-profit, theresolvewithinproject.org). The Sign in with Apple Services ID is
> now `org.theresolvewithinproject.app.signin`.
> - The old ID `com.cypherwavestudios.resolvewithin` has an existing App Store Connect record
>   (Apple ID `6765546619`; TestFlight-era May 2026 submissions only).
> - The new ID needs a **new** App Store Connect record (bundle IDs can't be changed on an existing record).
> - **Rename the old record before removing it** so the app name "Resolve Within" is freed and can move to the new record.
> - Android: the new package is a new app to Google Play / Android and needs a new upload keystore (EAS-managed);
>   Google OAuth Android clients (if ever added) must use the new package + new key's SHA-1/SHA-256.

OAuth client IDs and secrets are **not** stored in this repository (Better Auth / hosting cloud configuration). Do not invent or commit them.

> **Backend hosts:** production default is Render (`https://resolve-within-backend.onrender.com`). The Specular host is **legacy / rollback only** and is not deleted; OAuth redirect URIs may still list it until fully retired.

## External systems to update after identity change
1. **Google Cloud Console** — OAuth client(s):
   - Android package name + SHA-1/SHA-256 of the release signing key
   - iOS bundle ID (if iOS client used)
   - Authorized redirect URIs for the production Render / Better Auth callback host (and legacy Specular host if still registered for rollback)
2. **Apple Developer** — Sign in with Apple:
   - App ID / Services ID bundle identifier
   - Return URLs matching backend auth callbacks
3. **Render (production) / Better Auth backend env** — trusted origins, redirect URLs, Google/Apple client IDs & secrets (Specular env is legacy/rollback only)
4. **Deep link / Universal Links / App Links** (if/when configured):
   - Associated domains / intent filters for `resolvewithin` and HTTPS app links

## Verification labels (Pass 5)
- SOURCE VERIFIED ONLY for client scheme + auth client wiring in repo
- CONFIGURATION / RUNTIME of live Google/Apple clients: owner action required
