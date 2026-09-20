# Admin Provisioning Runbook (V1)

**Purpose:** Grant and revoke administrator access for Resolve Within using trusted server/database access only.  
**Scope:** V1 uses the DB column `user.is_admin` (Drizzle: `user.isAdmin`). There is **no** in-app “make admin” control and **no** client-assignable admin flag.

> Never commit real credentials, connection strings, or personal emails into this repo. Substitute placeholders below with values from your secrets manager / hosting console.

---

## Principles

1. **Server is authoritative.** Admin UI and client route guards are convenience only; every admin API re-checks `user.is_admin` from the database.
2. **No client self-promotion.** `PUT /api/user/preferences` must not accept or persist `isAdmin` (verified by integration tests when the suite can run).
3. **Least privilege.** Promote the smallest set of trusted operators. Prefer named accounts over shared logins.
4. **Auditable.** Record who was promoted, by whom, when, and why in an ops log outside the app (ticket / incident notes).

---

## Prerequisites

- Trusted access to the production (or staging) Postgres database used by the **production Render** backend (`https://resolve-within-backend.onrender.com`; Specular host is legacy/rollback only)
  - OR trusted shell/SQL console on the host that already has DB credentials injected
- Ability to identify the target user’s stable `id` (UUID) and/or verified `email`
- Confirmation that the target account already exists (user has signed up at least once)

---

## First admin (bootstrap)

Use this when **no** admins exist yet.

1. Confirm the target user exists:

```sql
SELECT id, email, name, is_admin, created_at
FROM "user"
WHERE email = '<TARGET_EMAIL>';
```

2. If no row is returned, have the person complete normal sign-up in the app first, then re-run the query.

3. Promote:

```sql
UPDATE "user"
SET is_admin = true
WHERE email = '<TARGET_EMAIL>'
  AND is_admin = false
RETURNING id, email, is_admin;
```

4. Verify (see [Verify](#verify)).

5. Record in ops notes: date (UTC), actor, target user id/email, environment (prod/staging), ticket id.

---

## Subsequent admins

Same SQL as first admin. Prefer promoting by `id` when email might collide across environments:

```sql
UPDATE "user"
SET is_admin = true
WHERE id = '<TARGET_USER_UUID>'
  AND is_admin = false
RETURNING id, email, is_admin;
```

Optional: list current admins before/after:

```sql
SELECT id, email, name, is_admin, created_at
FROM "user"
WHERE is_admin = true
ORDER BY created_at;
```

---

## Verify

### Database

```sql
SELECT id, email, is_admin FROM "user" WHERE email = '<TARGET_EMAIL>';
-- Expect: is_admin = true
```

### Application (manual)

1. Sign in as the promoted user on a non-production build first when possible.
2. Open **Profile** → confirm **Admin Dashboard** entry is visible.
3. Open `/admin` → queue loads (or empty state), not an immediate redirect/forbidden.
4. As a **non-admin** control account, confirm:
   - Profile does **not** show Admin Dashboard
   - `GET /api/admin/reports` returns **403**
   - Hide/dismiss admin actions return **403**

### API spot-check (authenticated)

```bash
# Non-admin must be 403
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <NON_ADMIN_TOKEN>" \
  "<API_BASE>/api/admin/reports"

# Admin should be 200
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "<API_BASE>/api/admin/reports"
```

Replace `<API_BASE>` with the deployed backend URL from app config (never paste live tokens into tickets or git).

---

## Rollback (revoke admin)

```sql
UPDATE "user"
SET is_admin = false
WHERE id = '<TARGET_USER_UUID>'
  AND is_admin = true
RETURNING id, email, is_admin;
```

Verify the user can no longer open Admin Dashboard meaningfully and that admin APIs return 403 for their session (sign out/in once to refresh profile if the client cached `isAdmin`).

---

## What NOT to do

- Do **not** add a client “Make Admin” button or accept `isAdmin` from preference/profile update payloads.
- Do **not** hardcode reviewer passwords or admin emails in source. Reviewer bootstrap uses env-gated `REVIEWER_EMAIL` / `REVIEWER_PASSWORD` on `POST /api/setup/create-reviewer` and does **not** grant `is_admin` by itself—promote via SQL after create if a reviewer needs moderation tools.
- Do **not** grant admin by editing only local SecureStore / AsyncStorage / JWT claims; those are not the source of truth.
- Do **not** run destructive `DELETE`/`DROP` while provisioning.

---

## Audit notes (ops checklist)

For every promote/revoke, record:

| Field | Example |
|-------|---------|
| Environment | production / staging |
| Timestamp (UTC) | 2026-09-15T20:00:00Z |
| Actor | ops engineer / owner |
| Action | promote / revoke |
| Target user id | UUID |
| Target email | redacted in public channels |
| Reason / ticket | MOD-123 |
| Verification | SQL row + API 200/403 checks |

Retain notes in your normal ops system (not in git).

---

## Related code (reference)

- Schema: `backend/src/db/schema/auth-schema.ts` → `user.isAdmin` / `is_admin`
- Admin APIs: `backend/src/routes/admin.ts`, `backend/src/routes/reports.ts` (`requireAdmin` / `isAdmin` DB checks)
- Client guard: `app/admin.tsx` (redirect if profile not admin); Profile entry gated on `profile.isAdmin`
- Authz tests (when backend suite runnable): `backend/tests/integration.test.ts` (non-admin 403 + preferences cannot self-assign)

---

## Incident: accidental promotion

1. Revoke immediately with rollback SQL.
2. Review `admin_actions` / report review fields for actions taken during the window.
3. Rotate any session if account compromise is suspected (sign out all sessions via Better Auth / hosting tools if available).
4. Document timeline in the ops log.
