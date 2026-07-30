import type { App } from "../index.js";
import { communityPosts, reportedPosts } from "../db/schema/schema.js";
import { eq } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CreateReportBody {
  postId: string;
  reason?: string;
  notes?: string;
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
            postId: {
              type: "string",
              format: "uuid",
            },
            reason: {
              type: "string",
            },
            notes: {
              type: "string",
            },
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
          401: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
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

      return {
        success: true,
        reportId: report.id,
      };
    }
  );
}