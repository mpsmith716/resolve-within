# Member Blocking (App Store guideline 1.2)

Signed-in members can block another member from any community post (🚫 Block, next to 🚩 Report).
Blocking is two-way for visibility: the blocker stops seeing the blocked member's community posts
and spotlight nominations, and the blocked member stops seeing the blocker's. Nobody is notified.
Blocks are managed in **Profile → Privacy → Blocked Users** (unblock there). Guests never see Block
(the community requires sign-in).

## Data
`user_blocks` (migration `backend/drizzle/20261008172451_user_blocks.sql`, additive only):

| column | notes |
|---|---|
| `id` uuid PK | used by the app to unblock |
| `blocker_id` → `user.id` | `ON DELETE CASCADE` |
| `blocked_id` → `user.id` | `ON DELETE CASCADE` |
| `display_name` | label shown to the blocker, captured at block time. Anonymous posts store "Anonymous member", so blocking never reveals who wrote an anonymous post |
| `created_at` | |

Constraints: unique `(blocker_id, blocked_id)`, index on `blocked_id`, `CHECK (blocker_id <> blocked_id)`.
Account deletion (`DELETE /api/user/data`) removes rows in both directions explicitly; the FKs cascade too.

## API
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/blocks/status` | public | `{ available }`: true once the `user_blocks` table exists (read-only deploy check) |
| GET | `/api/blocks` | required | `[{ id, displayName, createdAt }]`, newest first. Never returns user ids |
| POST | `/api/blocks` | required | `{ postId }` (or `{ userId }`). Idempotent, 201. 400 for self-block, 404 for unknown post/user |
| DELETE | `/api/blocks/:id` | required | Only the blocker can remove their block (404 otherwise) |

`GET /api/community/:community` now excludes posts where a block exists in either direction and adds
`isOwnPost` to each post (the app hides Block on your own posts). Author ids are still never returned.

## Migration safety
The migration only creates a new table, indexes and FKs; it does not touch existing rows.
Its journal timestamp is later than every earlier migration, so drizzle's migrator applies it on any
database that already has the earlier migrations.

Until the migration has been applied, the server keeps working: feeds are served unfiltered, the block
endpoints answer 503 "Blocking is temporarily unavailable", and `/api/blocks/status` returns
`{ "available": false }`. After deploying, check `GET /api/blocks/status`. If it stays `false`,
apply the migration with `npm run db:migrate` (backend, with the production `DATABASE_URL`) —
owner action, since it writes to the production database.
