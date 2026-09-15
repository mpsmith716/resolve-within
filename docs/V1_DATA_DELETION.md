# V1 Data Deletion Contract

## Scope
**Delete My Data** removes user-owned content and preference data. It is **not** full account closure.

## Server (owner-only, authenticated `DELETE /api/user/data`)
Deleted:
- `journal_entries`
- `community_posts` authored by the user (cascades related post reports/interactions/nominations tied to those posts)
- `post_interactions` by the user
- `breathing_sessions`
- `favorite_exercises`
- `spotlight_nominations` by the user
- `spotlight_votes` by the user

Anonymized / integrity-preserving:
- `reported_posts.notes` cleared when `reporterUserId` is the requesting user (row retained for moderation integrity)

Reset (account retained):
- `user.userType`, `notificationTime`, `messageStreams`, `disclaimerAcceptedAt`, `badgeTier`, `showBadge`

Retained intentionally:
- `user` row (id/email/name) for continued sign-in
- `session` / `account` / `verification` (cleared client-side on logout after success)
- `admin_actions` audit rows
- Daily message catalog content (not user-owned)

## Client (after server success only)
Clears SecureStore / AsyncStorage preference keys and local favorites. Signs the user out. **No success UI if the server call fails.**

## Out of scope for V1
- Hard-deleting the auth account row
- Inventing legal retention periods beyond this product contract
