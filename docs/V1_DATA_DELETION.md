# V1 Data Deletion Contract

## Scope
**Delete Account & Data** (formerly labeled Delete My Data) performs **true account deletion**: user-owned app data **and** the Better Auth identity/credentials are permanently removed. The same email/password must not authenticate afterward; signing up again creates a **new** identity.

## Server (owner-only, authenticated `DELETE /api/user/data`)
Authority is the **authenticated session user only**. Client-supplied `userId` / `email` are never trusted as authority.

### Request body
- `password` (string, **required for email/password credential accounts**): confirms identity before irreversible deletion.
- OAuth-only accounts (no credential password): session auth is sufficient for V1.

### Deleted (application transaction)
- `spotlight_votes` (voter)
- `spotlight_nominations` (nominator)
- `post_interactions` (user)
- `community_posts` authored by the user (DB CASCADE also clears related reports/interactions/nominations/winners on those posts)
- `journal_entries`
- `breathing_sessions`
- `favorite_exercises`
- `reported_posts` filed by the user (see Owner decisions — schema forces removal)
- `verification` rows for the user email and `delete-account-*` tokens
- `session` rows for the user
- `account` rows (credentials / OAuth links)
- `user` row (Better Auth identity)

### Anonymized / integrity
- Report `notes` cleared immediately before report row deletion.
- `reported_posts.reviewed_by` cleared when this user was the reviewer (`ON DELETE SET NULL`).

### Retained intentionally
- `admin_actions` audit rows **for other admins** (not deleted by a normal user wipe).
- Daily message catalog content (not user-owned).
- **OWNER ACTION REQUIRED — admin self-deletion:** `admin_actions.admin_id` is `ON DELETE CASCADE`. If an admin account is deleted, that admin’s audit rows are removed. Do not use production admin accounts for deletion testing. Prefer a future migration (`SET NULL` / retain anonymized actor) if legal/ops require keeping admin audit after actor removal.

### Failure behavior
On any failure the handler returns an error and **does not** claim success. Prefer a single DB transaction so identity and app data commit or roll back together. The client must **not** clear local auth/session unless the server returned success.

## Client (after server success only)
1. Clear SecureStore / AsyncStorage preference keys and local favorites.
2. Clear bearer token + auth session (`signOut` / `clearAuthTokens`).
3. `router.replace('/auth')` immediately — **never** briefly show Home as still authenticated.
4. No success UI that leaves the user on an authenticated stack; errors allow retry without wiping local auth.

## Disposition matrix (schema → action)

| Entity | Disposition | Notes |
|--------|-------------|-------|
| `user` | **DELETE** | Better Auth identity |
| `account` | **DELETE** | Credentials / OAuth links |
| `session` | **DELETE** | Invalidate all sessions |
| `verification` | **DELETE** | By email + delete-account tokens (no FK) |
| User prefs on `user` (`userType`, `notificationTime`, `messageStreams`, `disclaimerAcceptedAt`, `badgeTier`, `showBadge`) | **DELETE** (with user row) | Not reset-and-retain |
| `journal_entries` | **DELETE** / CASCADE | Explicit delete then user CASCADE |
| `community_posts` (authored) | **DELETE** / CASCADE | |
| `post_interactions` | **DELETE** / CASCADE | |
| `spotlight_nominations` | **DELETE** / CASCADE | |
| `spotlight_votes` | **DELETE** / CASCADE | |
| `spotlight_winners` | **CASCADE** via post | When authored posts deleted |
| `breathing_sessions` | **DELETE** / CASCADE | |
| `favorite_exercises` | **DELETE** / CASCADE | |
| `reported_posts` (as reporter) | **DELETE** (forced by schema) | See owner decision |
| `reported_posts.reviewed_by` | **SET NULL** | Existing FK |
| `admin_actions` | **RETAIN** for others; **CASCADE** if deleting that admin | Owner decision for admin self-delete |
| `daily_messages` | **RETAIN** | Not user-owned |
| Notifications / local prefs | **DELETE** (client SecureStore/AsyncStorage) | |
| Veteran / faith prefs (`userType`, `messageStreams`) | **DELETE** with user | |

## Migrations
- **READ-ONLY VERIFICATION:** Existing FKs already use `ON DELETE CASCADE` for user-owned tables and `ON DELETE SET NULL` for `reported_posts.reviewed_by`. No production migration was applied by this pass.
- **RECOMMENDED MIGRATION REQUIRES OWNER APPROVAL:** To **retain** moderation reports after reporter account deletion, alter `reported_posts.reporter_user_id` to nullable + `ON DELETE SET NULL` (or anonymized sentinel), then change disposition from DELETE → ANONYMIZE/RETAIN.
- **RECOMMENDED MIGRATION REQUIRES OWNER APPROVAL:** For admin audit retention after admin account deletion, alter `admin_actions.admin_id` to nullable + `ON DELETE SET NULL` (or anonymize).

## Out of scope / not invented
- Legal retention periods beyond this product contract — **OWNER ACTION REQUIRED** if counsel requires different report/audit retention.
- Live destructive deletion against production DB from automation agents.
- Testing against the owner’s admin account.
