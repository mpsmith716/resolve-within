import type { App } from "../index.js";
import { communityPosts, postInteractions } from "../db/schema/schema.js";
import { eq, desc, and } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CreatePostBody {
  content: string;
  isAnonymous?: boolean;
}

interface InteractBody {
  type: "like" | "encourage" | "flag";
}

interface CommunityQuerystring {
  limit?: number;
  offset?: number;
}

export function registerCommunityRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // GET /api/community/:community - Get posts for a community
  app.fastify.get<{ Params: { community: string }; Querystring: CommunityQuerystring }>(
    "/api/community/:community",
    {
      schema: {
        description: "Get posts for a specific community",
        tags: ["community"],
        params: {
          type: "object",
          required: ["community"],
          properties: {
            community: {
              type: "string",
              enum: ["veteran", "healing_together"],
              description: "Community name",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20 },
            offset: { type: "number", default: 0 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                authorName: { type: "string" },
                isAnonymous: { type: "boolean" },
                content: { type: "string" },
                isPinned: { type: "boolean" },
                likeCount: { type: "number" },
                encourageCount: { type: "number" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { community: string }; Querystring: CommunityQuerystring }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(request.query.limit ?? 20, 100);
      const offset = request.query.offset ?? 0;

      app.logger.info({ community: request.params.community, limit, offset }, "Fetching community posts");

      const posts = await db
        .select()
        .from(communityPosts)
        .where(
          and(
            eq(communityPosts.community, request.params.community as "veteran" | "healing_together"),
            eq(communityPosts.isHidden, false)
          )
        )
        .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
        .limit(limit)
        .offset(offset);

      app.logger.info({ count: posts.length }, "Community posts fetched");
      return posts;
    }
  );

  // POST /api/community/:community - Create a post
  app.fastify.post<{ Params: { community: string }; Body: CreatePostBody }>(
    "/api/community/:community",
    {
      schema: {
        description: "Create a new community post",
        tags: ["community"],
        params: {
          type: "object",
          required: ["community"],
          properties: {
            community: {
              type: "string",
              enum: ["veteran", "healing_together"],
            },
          },
        },
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", description: "Post content" },
            isAnonymous: { type: "boolean", default: true },
          },
        },
        response: {
          201: {
            description: "Post created successfully",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              authorName: { type: "string" },
              isAnonymous: { type: "boolean" },
              content: { type: "string" },
              likeCount: { type: "number" },
              encourageCount: { type: "number" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { community: string }; Body: CreatePostBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const isAnonymous = request.body.isAnonymous ?? true;
      const authorName = isAnonymous ? "Anonymous" : session.user.name;

      app.logger.info(
        { userId: session.user.id, community: request.params.community, isAnonymous },
        "Creating community post"
      );

      const [post] = await db
        .insert(communityPosts)
        .values({
          authorId: session.user.id,
          authorName,
          isAnonymous,
          community: request.params.community as "veteran" | "healing_together",
          content: request.body.content,
        })
        .returning();

      app.logger.info({ postId: post.id }, "Community post created successfully");
      reply.code(201);
      return post;
    }
  );

  // POST /api/community/posts/:id/interact - Like, encourage, or flag a post
  app.fastify.post<{ Params: { id: string }; Body: InteractBody }>(
    "/api/community/posts/:id/interact",
    {
      schema: {
        description: "Interact with a community post (like, encourage, or flag)",
        tags: ["community"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["like", "encourage", "flag"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              likeCount: { type: "number" },
              encourageCount: { type: "number" },
              flagCount: { type: "number" },
              isHidden: { type: "boolean" },
            },
          },
          401: {
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
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: InteractBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, postId: request.params.id, type: request.body.type },
        "Creating interaction"
      );

      // Check if post exists
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, request.params.id));

      if (!post) {
        app.logger.warn({ postId: request.params.id }, "Post not found");
        reply.code(404);
        return { error: "Post not found" };
      }

      // Check if interaction already exists
      const existing = await db
        .select()
        .from(postInteractions)
        .where(
          and(
            eq(postInteractions.postId, request.params.id),
            eq(postInteractions.userId, session.user.id),
            eq(postInteractions.type, request.body.type)
          )
        );

      if (existing.length > 0) {
        // Remove interaction (toggle)
        await db.delete(postInteractions).where(eq(postInteractions.id, existing[0].id));

        // Update count based on type
        if (request.body.type === "like") {
          await db
            .update(communityPosts)
            .set({ likeCount: Math.max(0, post.likeCount - 1) })
            .where(eq(communityPosts.id, request.params.id));
        } else if (request.body.type === "encourage") {
          await db
            .update(communityPosts)
            .set({ encourageCount: Math.max(0, post.encourageCount - 1) })
            .where(eq(communityPosts.id, request.params.id));
        } else {
          await db
            .update(communityPosts)
            .set({ flagCount: Math.max(0, post.flagCount - 1) })
            .where(eq(communityPosts.id, request.params.id));
        }
      } else {
        // Add interaction
        await db.insert(postInteractions).values({
          postId: request.params.id as any,
          userId: session.user.id,
          type: request.body.type,
        });

        // Update count based on type
        if (request.body.type === "like") {
          await db
            .update(communityPosts)
            .set({ likeCount: post.likeCount + 1 })
            .where(eq(communityPosts.id, request.params.id));
        } else if (request.body.type === "encourage") {
          await db
            .update(communityPosts)
            .set({ encourageCount: post.encourageCount + 1 })
            .where(eq(communityPosts.id, request.params.id));
        } else {
          await db
            .update(communityPosts)
            .set({ flagCount: post.flagCount + 1 })
            .where(eq(communityPosts.id, request.params.id));
        }
      }

      // Auto-hide if flagCount >= 5
      const [updatedPost] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, request.params.id));

      if (updatedPost.flagCount >= 5 && !updatedPost.isHidden) {
        await db
          .update(communityPosts)
          .set({ isHidden: true })
          .where(eq(communityPosts.id, request.params.id));

        app.logger.info({ postId: request.params.id, flagCount: updatedPost.flagCount }, "Post auto-hidden");
      }

      app.logger.info({ postId: request.params.id }, "Interaction processed successfully");
      return updatedPost;
    }
  );

  // DELETE /api/community/posts/:id - Delete a post
  app.fastify.delete<{ Params: { id: string } }>(
    "/api/community/posts/:id",
    {
      schema: {
        description: "Delete a community post",
        tags: ["community"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, postId: request.params.id }, "Deleting post");

      const [post] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, request.params.id));

      if (!post) {
        app.logger.warn({ postId: request.params.id }, "Post not found");
        reply.code(404);
        return { error: "Post not found" };
      }

      // Check if user is author or admin
      if (post.authorId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, postId: request.params.id }, "Unauthorized delete attempt");
        reply.code(403);
        return { error: "Not authorized to delete this post" };
      }

      await db.delete(communityPosts).where(eq(communityPosts.id, request.params.id));

      app.logger.info({ postId: request.params.id }, "Post deleted successfully");
      return { success: true };
    }
  );
}
