# Production OAuth — External Config Checklist

In-repo scheme remains `resolvewithin`. Production package/bundle IDs are now:
`com.cypherwavestudios.resolvewithin`.

OAuth client IDs and secrets are **not** stored in this repository (Better Auth / Specular cloud configuration). Do not invent or commit them.

## External systems to update after identity change
1. **Google Cloud Console** — OAuth client(s):
   - Android package name + SHA-1/SHA-256 of the release signing key
   - iOS bundle ID (if iOS client used)
   - Authorized redirect URIs for the Specular/Better Auth callback host
2. **Apple Developer** — Sign in with Apple:
   - App ID / Services ID bundle identifier
   - Return URLs matching backend auth callbacks
3. **Specular / Better Auth backend env** — trusted origins, redirect URLs, Google/Apple client IDs & secrets
4. **Deep link / Universal Links / App Links** (if/when configured):
   - Associated domains / intent filters for `resolvewithin` and HTTPS app links

## Verification labels (Pass 5)
- SOURCE VERIFIED ONLY for client scheme + auth client wiring in repo
- CONFIGURATION / RUNTIME of live Google/Apple clients: owner action required
