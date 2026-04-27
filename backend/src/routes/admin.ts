import type { App } from "../index.js";
import { communityPosts, adminActions } from "../db/schema/schema.js";
import { user } from "../db/schema/auth-schema.js";
import { eq, gte } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface HidePostBody {
  reason: string;
}

const ADMIN_ROLE = "admin"; // You would normally get this from a role/permissions system

// Helper to check if user is admin
async function isAdmin(userId: string, db: any): Promise<boolean> {
  // For now, return false. In production, check against a roles/permissions table
  // This is a placeholder - you should implement proper admin role checking
  return false;
}

export function registerAdminRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // POST /api/admin/posts/:id/hide - Hide a flagged post
  app.fastify.post<{ Params: { id: string }; Body: HidePostBody }>(
    "/api/admin/posts/:id/hide",
    {
      schema: {
        description: "Hide a flagged post (admin only)",
        tags: ["admin"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          403: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          404: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: HidePostBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, postId: request.params.id }, "Attempting to hide post");

      // Check admin status
      const admin = await isAdmin(session.user.id, db);
      if (!admin) {
        app.logger.warn({ userId: session.user.id }, "Non-admin attempted to hide post");
        reply.code(403);
        return { error: "Admin access required" };
      }

      // Check if post exists
      const [post] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, request.params.id as any));

      if (!post) {
        app.logger.warn({ postId: request.params.id }, "Post not found");
        reply.code(404);
        return { error: "Post not found" };
      }

      // Hide post
      await db
        .update(communityPosts)
        .set({ isHidden: true })
        .where(eq(communityPosts.id, request.params.id as any));

      // Log admin action
      await db.insert(adminActions).values({
        adminId: session.user.id,
        action: "hide_post",
        targetId: request.params.id,
        reason: request.body.reason,
      });

      app.logger.info({ postId: request.params.id, reason: request.body.reason }, "Post hidden successfully");
      return { success: true };
    }
  );

  // POST /api/admin/posts/:id/unhide - Unhide a post
  app.fastify.post<{ Params: { id: string }; Body: HidePostBody }>(
    "/api/admin/posts/:id/unhide",
    {
      schema: {
        description: "Unhide a post (admin only)",
        tags: ["admin"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          403: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          404: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: HidePostBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, postId: request.params.id }, "Attempting to unhide post");

      // Check admin status
      const admin = await isAdmin(session.user.id, db);
      if (!admin) {
        app.logger.warn({ userId: session.user.id }, "Non-admin attempted to unhide post");
        reply.code(403);
        return { error: "Admin access required" };
      }

      // Check if post exists
      const [post] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, request.params.id as any));

      if (!post) {
        app.logger.warn({ postId: request.params.id }, "Post not found");
        reply.code(404);
        return { error: "Post not found" };
      }

      // Unhide post
      await db
        .update(communityPosts)
        .set({ isHidden: false })
        .where(eq(communityPosts.id, request.params.id as any));

      // Log admin action
      await db.insert(adminActions).values({
        adminId: session.user.id,
        action: "unhide_post",
        targetId: request.params.id,
        reason: request.body.reason,
      });

      app.logger.info({ postId: request.params.id }, "Post unhidden successfully");
      return { success: true };
    }
  );

  // GET /api/admin/flagged-posts - Get posts with flagCount >= 3
  app.fastify.get(
    "/api/admin/flagged-posts",
    {
      schema: {
        description: "Get flagged posts requiring moderation",
        tags: ["admin"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                content: { type: "string" },
                flagCount: { type: "number" },
                authorId: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          403: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, "Fetching flagged posts");

      // Check admin status
      const admin = await isAdmin(session.user.id, db);
      if (!admin) {
        app.logger.warn({ userId: session.user.id }, "Non-admin attempted to fetch flagged posts");
        reply.code(403);
        return { error: "Admin access required" };
      }

      const flaggedPosts = await db
        .select()
        .from(communityPosts)
        .where(gte(communityPosts.flagCount, 3));

      app.logger.info({ count: flaggedPosts.length }, "Flagged posts fetched");
      return flaggedPosts;
    }
  );
}
