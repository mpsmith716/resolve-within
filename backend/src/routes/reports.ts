import type { App } from "../index.js";
import { communityPosts, reportedPosts, adminActions } from "../db/schema/schema.js";
import { user } from "../db/schema/auth-schema.js";
import { desc, eq } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CreateReportBody {
  postId: string;
  reason?: string;
  notes?: string;
}

async function requireAdmin(
  app: App,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requireAuth = app.requireAuth();
  const session = await requireAuth(request, reply);
  if (!session) return null;

  const [currentUser] = await app.db
    .select({ isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!currentUser?.isAdmin) {
    reply.code(403);
    return null;
  }

  return session;
}

export function registerReportRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  app.fastify.post<{ Body: CreateReportBody }>(
    "/api/reports",
    {
      schema: {
        description: "Report a community post",
        tags: ["reports"],
        body: {
          type: "object",
          required: ["postId"],
          properties: {
            postId: { type: "string", format: "uuid" },
            reason: { type: "string" },
            notes: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              reportId: { type: "string", format: "uuid" },
            },
          },
          401: { type: "object", properties: { error: { type: "string" } } },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateReportBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const post = await db
        .select({ id: communityPosts.id })
        .from(communityPosts)
        .where(eq(communityPosts.id, request.body.postId))
        .limit(1);

      if (!post.length) {
        reply.code(404);
        return { error: "Post not found" };
      }

      const [report] = await db
        .insert(reportedPosts)
        .values({
          postId: request.body.postId,
          reporterUserId: session.user.id,
          reason: request.body.reason ?? "safety_concern",
          notes: request.body.notes?.trim() || null,
        })
        .returning({ id: reportedPosts.id });

      app.logger.info(
        {
          reportId: report.id,
          postId: request.body.postId,
          reporterUserId: session.user.id,
        },
        "Community post reported"
      );

      reply.code(201);
      return { success: true, reportId: report.id };
    }
  );

  app.fastify.get(
    "/api/admin/reports",
    {
      schema: {
        description: "Get reported community posts for administrators",
        tags: ["admin", "reports"],
        response: {
          200: {
            type: "object",
            properties: {
              reports: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    postId: { type: "string", format: "uuid" },
                    reporterUserId: { type: "string" },
                    reason: { type: "string" },
                    notes: { anyOf: [{ type: "string" }, { type: "null" }] },
                    status: { type: "string" },
                    createdAt: { type: "string" },
                    reviewedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
                    postContent: { type: "string" },
                    postAuthorName: { type: "string" },
                    postIsAnonymous: { type: "boolean" },
                    postIsHidden: { type: "boolean" },
                  },
                },
              },
            },
          },
          401: { type: "object", properties: { error: { type: "string" } } },
          403: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAdmin(app, request, reply);
      if (!session) {
        return { error: "Administrator access required" };
      }

      const reports = await db
        .select({
          id: reportedPosts.id,
          postId: reportedPosts.postId,
          reporterUserId: reportedPosts.reporterUserId,
          reason: reportedPosts.reason,
          notes: reportedPosts.notes,
          status: reportedPosts.status,
          createdAt: reportedPosts.createdAt,
          reviewedAt: reportedPosts.reviewedAt,
          postContent: communityPosts.content,
          postAuthorName: communityPosts.authorName,
          postIsAnonymous: communityPosts.isAnonymous,
          postIsHidden: communityPosts.isHidden,
        })
        .from(reportedPosts)
        .innerJoin(communityPosts, eq(reportedPosts.postId, communityPosts.id))
        .orderBy(desc(reportedPosts.createdAt));

      return { reports };
    }
  );

  // Hide post from a report: hide post, mark report action_taken, log action
  app.fastify.post<{ Params: { id: string } }>(
    "/api/admin/reports/:id/hide",
    {
      schema: {
        description: "Hide the reported post and mark the report actioned",
        tags: ["admin", "reports"],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
          401: { type: "object", properties: { error: { type: "string" } } },
          403: { type: "object", properties: { error: { type: "string" } } },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAdmin(app, request, reply);
      if (!session) {
        return { error: "Administrator access required" };
      }

      const [report] = await db
        .select()
        .from(reportedPosts)
        .where(eq(reportedPosts.id, request.params.id))
        .limit(1);

      if (!report) {
        reply.code(404);
        return { error: "Report not found" };
      }

      await db
        .update(communityPosts)
        .set({ isHidden: true })
        .where(eq(communityPosts.id, report.postId));

      await db
        .update(reportedPosts)
        .set({
          status: "action_taken",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(eq(reportedPosts.id, report.id));

      await db.insert(adminActions).values({
        adminId: session.user.id,
        action: "hide_post",
        targetId: report.postId,
        reason: `report:${report.id}:${report.reason}`,
      });

      app.logger.info(
        { reportId: report.id, postId: report.postId, adminId: session.user.id },
        "Admin hid reported post"
      );

      return { success: true };
    }
  );

  // Dismiss report: leave post visible, mark dismissed, log action
  app.fastify.post<{ Params: { id: string } }>(
    "/api/admin/reports/:id/dismiss",
    {
      schema: {
        description: "Dismiss a report without hiding the post",
        tags: ["admin", "reports"],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
          401: { type: "object", properties: { error: { type: "string" } } },
          403: { type: "object", properties: { error: { type: "string" } } },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAdmin(app, request, reply);
      if (!session) {
        return { error: "Administrator access required" };
      }

      const [report] = await db
        .select()
        .from(reportedPosts)
        .where(eq(reportedPosts.id, request.params.id))
        .limit(1);

      if (!report) {
        reply.code(404);
        return { error: "Report not found" };
      }

      await db
        .update(reportedPosts)
        .set({
          status: "dismissed",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        })
        .where(eq(reportedPosts.id, report.id));

      await db.insert(adminActions).values({
        adminId: session.user.id,
        action: "dismiss_report",
        targetId: report.id,
        reason: `post:${report.postId}:${report.reason}`,
      });

      app.logger.info(
        { reportId: report.id, postId: report.postId, adminId: session.user.id },
        "Admin dismissed report"
      );

      return { success: true };
    }
  );
}
