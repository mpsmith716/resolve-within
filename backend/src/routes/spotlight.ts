import type { App } from "../index.js";
import { spotlightNominations, spotlightVotes, spotlightWinners, communityPosts } from "../db/schema/schema.js";
import { eq, and, desc } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface NominateBody {
  postId: string;
  reason: string;
}

export function registerSpotlightRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // Helper: Get current week start (Monday 00:00 UTC)
  function getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
    return weekStart;
  }

  // POST /api/spotlight/nominate - Nominate a post
  app.fastify.post<{ Body: NominateBody }>(
    "/api/spotlight/nominate",
    {
      schema: {
        description: "Nominate a post for spotlight",
        tags: ["spotlight"],
        body: {
          type: "object",
          required: ["postId", "reason"],
          properties: {
            postId: { type: "string", format: "uuid" },
            reason: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              postId: { type: "string", format: "uuid" },
              reason: { type: "string" },
              weekStart: { type: "string", format: "date-time" },
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
    async (request: FastifyRequest<{ Body: NominateBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, postId: request.body.postId }, "Nominating post for spotlight");

      // Check if post exists
      const [post] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, request.body.postId as any));

      if (!post) {
        app.logger.warn({ postId: request.body.postId }, "Post not found");
        reply.code(404);
        return { error: "Post not found" };
      }

      const weekStart = getCurrentWeekStart();

      // Check if already nominated this week
      const existing = await db
        .select()
        .from(spotlightNominations)
        .where(
          and(
            eq(spotlightNominations.postId, request.body.postId as any),
            eq(spotlightNominations.nominatorId, session.user.id),
            eq(spotlightNominations.weekStart, weekStart)
          )
        );

      if (existing.length > 0) {
        app.logger.warn({ postId: request.body.postId, weekStart }, "Already nominated this week");
        reply.code(400);
        return { error: "Already nominated this post this week" };
      }

      const [nomination] = await db
        .insert(spotlightNominations)
        .values({
          postId: request.body.postId as any,
          nominatorId: session.user.id,
          reason: request.body.reason,
          weekStart,
        })
        .returning();

      app.logger.info({ nominationId: nomination.id }, "Post nominated successfully");
      reply.code(201);
      return nomination;
    }
  );

  // GET /api/spotlight/current - Get current week's nominations with vote counts
  app.fastify.get(
    "/api/spotlight/current",
    {
      schema: {
        description: "Get current week's spotlight nominations",
        tags: ["spotlight"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                post: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    authorName: { type: "string" },
                    content: { type: "string" },
                  },
                },
                reason: { type: "string" },
                voteCount: { type: "number" },
                userVoted: { type: "boolean" },
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const weekStart = getCurrentWeekStart();

      app.logger.info({ weekStart }, "Fetching current spotlight nominations");

      const nominations = await db
        .select()
        .from(spotlightNominations)
        .where(eq(spotlightNominations.weekStart, weekStart));

      // Get vote counts and user votes
      const result = [];
      for (const nomination of nominations) {
        const votes = await db
          .select()
          .from(spotlightVotes)
          .where(eq(spotlightVotes.nominationId, nomination.id));

        const userVote = votes.find((v) => v.voterId === session.user.id);

        const [post] = await db
          .select()
          .from(communityPosts)
          .where(eq(communityPosts.id, nomination.postId));

        result.push({
          id: nomination.id,
          post: {
            id: post.id,
            authorName: post.authorName,
            content: post.content,
          },
          reason: nomination.reason,
          voteCount: votes.length,
          userVoted: !!userVote,
        });
      }

      app.logger.info({ count: result.length }, "Current nominations fetched");
      return result;
    }
  );

  // POST /api/spotlight/vote/:nominationId - Toggle vote for nomination
  app.fastify.post<{ Params: { nominationId: string } }>(
    "/api/spotlight/vote/:nominationId",
    {
      schema: {
        description: "Vote for a spotlight nomination",
        tags: ["spotlight"],
        params: {
          type: "object",
          required: ["nominationId"],
          properties: {
            nominationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              nominationId: { type: "string", format: "uuid" },
              voteCount: { type: "number" },
              userVoted: { type: "boolean" },
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
    async (request: FastifyRequest<{ Params: { nominationId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, nominationId: request.params.nominationId }, "Voting for nomination");

      // Check if nomination exists
      const [nomination] = await db
        .select()
        .from(spotlightNominations)
        .where(eq(spotlightNominations.id, request.params.nominationId as any));

      if (!nomination) {
        app.logger.warn({ nominationId: request.params.nominationId }, "Nomination not found");
        reply.code(404);
        return { error: "Nomination not found" };
      }

      const weekStart = getCurrentWeekStart();

      // Check if already voted
      const existing = await db
        .select()
        .from(spotlightVotes)
        .where(
          and(
            eq(spotlightVotes.nominationId, request.params.nominationId as any),
            eq(spotlightVotes.voterId, session.user.id)
          )
        );

      if (existing.length > 0) {
        // Remove vote (toggle)
        await db.delete(spotlightVotes).where(eq(spotlightVotes.id, existing[0].id));
      } else {
        // Add vote
        await db.insert(spotlightVotes).values({
          nominationId: request.params.nominationId as any,
          voterId: session.user.id,
          weekStart,
        });
      }

      // Get updated vote count
      const votes = await db
        .select()
        .from(spotlightVotes)
        .where(eq(spotlightVotes.nominationId, request.params.nominationId as any));

      const userVote = votes.find((v) => v.voterId === session.user.id);

      app.logger.info({ nominationId: request.params.nominationId, voteCount: votes.length }, "Vote toggled");

      return {
        nominationId: request.params.nominationId,
        voteCount: votes.length,
        userVoted: !!userVote,
      };
    }
  );

  // GET /api/spotlight/winner - Get current week's winner
  app.fastify.get(
    "/api/spotlight/winner",
    {
      schema: {
        description: "Get current week's spotlight winner",
        tags: ["spotlight"],
        response: {
          200: {
            type: "object",
            properties: {
              post: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  authorName: { type: "string" },
                  content: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              voteCount: { type: "number" },
              weekStart: { type: "string", format: "date-time" },
            },
          },
          404: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const weekStart = getCurrentWeekStart();

      app.logger.info({ weekStart }, "Fetching spotlight winner");

      const [winner] = await db
        .select()
        .from(spotlightWinners)
        .where(eq(spotlightWinners.weekStart, weekStart));

      if (!winner) {
        app.logger.warn({ weekStart }, "No winner found for week");
        reply.code(404);
        return { error: "No winner selected for this week" };
      }

      const [post] = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, winner.postId));

      const result = {
        post: {
          id: post.id,
          authorName: post.authorName,
          content: post.content,
          createdAt: post.createdAt,
        },
        voteCount: winner.voteCount,
        weekStart: winner.weekStart,
      };

      app.logger.info({ postId: post.id }, "Spotlight winner fetched");
      return result;
    }
  );
}
