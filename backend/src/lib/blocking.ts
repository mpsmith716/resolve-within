import { and, eq, notExists, or, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { userBlocks } from "../db/schema/schema.js";

/**
 * Shared helpers for member-to-member blocking.
 *
 * Blocking is two-way for content visibility: if A blocks B, A stops seeing B's
 * community content and B stops seeing A's.
 */

const RECHECK_MS = 60_000;
let tableReady = false;
let lastCheck = 0;
let pending: Promise<boolean> | null = null;

/**
 * True once the `user_blocks` table exists. Until the migration has been applied, feeds
 * skip block filtering (instead of failing) and the block endpoints answer 503. Once the
 * table is seen it is cached for the life of the process; a missing table is re-checked
 * at most once a minute.
 */
export async function isBlockingReady(db: any): Promise<boolean> {
  if (tableReady) return true;
  const now = Date.now();
  if (pending) return pending;
  if (lastCheck && now - lastCheck < RECHECK_MS) return false;
  lastCheck = now;
  pending = (async () => {
    try {
      const result: any = await db.execute(sql`select to_regclass('public.user_blocks') is not null as ready`);
      const rows = Array.isArray(result) ? result : result?.rows ?? [];
      tableReady = rows[0]?.ready === true || rows[0]?.ready === "t";
    } catch {
      tableReady = false;
    }
    return tableReady;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

/** Test hook: forget the cached readiness state. */
export function resetBlockingReadyCache() {
  tableReady = false;
  lastCheck = 0;
  pending = null;
}

/**
 * SQL condition that is true when there is NO block in either direction between
 * `viewerId` and the author in `authorColumn`.
 */
export function notBlockedEitherWay(db: any, viewerId: string, authorColumn: AnyColumn): SQL {
  return notExists(
    db
      .select({ one: sql`1` })
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, authorColumn)),
          and(eq(userBlocks.blockerId, authorColumn), eq(userBlocks.blockedId, viewerId))
        )
      )
  );
}

/** User ids hidden from `viewerId` (blocked by them, or who blocked them). */
export async function hiddenAuthorIds(db: any, viewerId: string): Promise<Set<string>> {
  const rows: { blockerId: string; blockedId: string }[] = await db
    .select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(or(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, viewerId)));
  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(row.blockerId === viewerId ? row.blockedId : row.blockerId);
  }
  return ids;
}

export const ANONYMOUS_BLOCK_LABEL = "Anonymous member";
export const DEFAULT_BLOCK_LABEL = "Community member";
