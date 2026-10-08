import type { App } from "../index.js";
import { user } from "../db/schema/auth-schema.js";
import { communityPosts, userBlocks } from "../db/schema/schema.js";
import { and, desc, eq } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";
import { ANONYMOUS_BLOCK_LABEL, DEFAULT_BLOCK_LABEL, isBlockingReady } from "../lib/blocking.js";

interface BlockBody {
  /** Block the author of this community post (the app never sees author ids). */
  postId?: string;
  /** Block a member directly by user id. */
  userId?: string;
}

const errorSchema = { type: "object", properties: { error: { type: "string" } } };

const blockedUserSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", description: "Block id (use it to unblock)" },
    displayName: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const UNAVAILABLE = "Blocking is temporarily unavailable. Please try again later.";

export function registerBlockRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // GET /api/blocks/status - Public, read-only: is blocking available (migration applied)?
  app.fastify.get(
    "/api/blocks/status",
    {
      schema: {
        description: "Whether member blocking is available on this server (user_blocks table present)",
        tags: ["blocks"],
        response: {
          200: { type: "object", properties: { available: { type: "boolean" } } },
        },
      },
    },
    async () => ({ available: await isBlockingReady(db) })
  );

  // GET /api/blocks - List members the signed-in user has blocked
  app.fastify.get(
    "/api/blocks",
    {
      schema: {
        description: "List members the signed-in user has blocked",
        tags: ["blocks"],
        response: {
          200: { type: "array", items: blockedUserSchema },
          401: errorSchema,
          503: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!(await isBlockingReady(db))) {
        reply.code(503);
        return { error: UNAVAILABLE };
      }

      const rows = await db
        .select({
          id: userBlocks.id,
          displayName: userBlocks.displayName,
          createdAt: userBlocks.createdAt,
        })
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, session.user.id))
        .orderBy(desc(userBlocks.createdAt));

      return rows.map((row: { id: string; displayName: string | null; createdAt: Date }) => ({
        ...row,
        displayName: row.displayName || DEFAULT_BLOCK_LABEL,
      }));
    }
  );

  // POST /api/blocks - Block a member (by one of their posts, or by user id)
  app.fastify.post<{ Body: BlockBody }>(
    "/api/blocks",
    {
      schema: {
        description:
          "Block a member. Their community content is hidden from you (and yours from them). Idempotent.",
        tags: ["blocks"],
        body: {
          type: "object",
          properties: {
            postId: { type: "string", format: "uuid" },
            userId: { type: "string", minLength: 1, maxLength: 255 },
          },
        },
        response: {
          201: blockedUserSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          503: errorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: BlockBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const viewerId = session.user.id;
      const postId = request.body?.postId;
      const directUserId = request.body?.userId;

      if ((!postId && !directUserId) || (postId && directUserId)) {
        reply.code(400);
        return { error: "Provide either postId or userId." };
      }

      if (!(await isBlockingReady(db))) {
        reply.code(503);
        return { error: UNAVAILABLE };
      }

      let blockedId: string;
      let displayName: string;

      if (postId) {
        const [post] = await db
          .select({
            authorId: communityPosts.authorId,
            authorName: communityPosts.authorName,
            isAnonymous: communityPosts.isAnonymous,
          })
          .from(communityPosts)
          .where(eq(communityPosts.id, postId));
        if (!post) {
          reply.code(404);
          return { error: "Post not found" };
        }
        blockedId = post.authorId;
        displayName = post.isAnonymous !== false ? ANONYMOUS_BLOCK_LABEL : post.authorName || DEFAULT_BLOCK_LABEL;
      } else {
        const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, directUserId!));
        if (!target) {
          reply.code(404);
          return { error: "User not found" };
        }
        blockedId = target.id;
        displayName = DEFAULT_BLOCK_LABEL;
      }

      if (blockedId === viewerId) {
        reply.code(400);
        return { error: "You can't block yourself." };
      }

      await db
        .insert(userBlocks)
        .values({ blockerId: viewerId, blockedId, displayName })
        .onConflictDoNothing({ target: [userBlocks.blockerId, userBlocks.blockedId] });

      const [row] = await db
        .select({
          id: userBlocks.id,
          displayName: userBlocks.displayName,
          createdAt: userBlocks.createdAt,
        })
        .from(userBlocks)
        .where(and(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, blockedId)));

      app.logger.info({ userId: viewerId, blockId: row?.id }, "Member blocked");
      reply.code(201);
      return { ...row, displayName: row?.displayName || DEFAULT_BLOCK_LABEL };
    }
  );

  // DELETE /api/blocks/:id - Unblock (only the blocker can remove their own block)
  app.fastify.delete<{ Params: { id: string } }>(
    "/api/blocks/:id",
    {
      schema: {
        description: "Unblock a member using the block id from GET /api/blocks",
        tags: ["blocks"],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: { type: "object", properties: { success: { type: "boolean" } } },
          401: errorSchema,
          404: errorSchema,
          503: errorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!(await isBlockingReady(db))) {
        reply.code(503);
        return { error: UNAVAILABLE };
      }

      const deleted = await db
        .delete(userBlocks)
        .where(and(eq(userBlocks.id, request.params.id), eq(userBlocks.blockerId, session.user.id)))
        .returning({ id: userBlocks.id });

      if (deleted.length === 0) {
        reply.code(404);
        return { error: "Block not found" };
      }

      app.logger.info({ userId: session.user.id, blockId: request.params.id }, "Member unblocked");
      return { success: true };
    }
  );
}
