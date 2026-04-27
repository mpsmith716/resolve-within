import type { App } from "../index.js";
import { breathingSessions } from "../db/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CreateSessionBody {
  sessionType: string;
  duration: number; // in seconds
}

export function registerBreathingRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // POST /api/breathing-sessions - Record a completed breathing session
  app.fastify.post<{ Body: CreateSessionBody }>(
    "/api/breathing-sessions",
    {
      schema: {
        description: "Record a completed breathing session",
        tags: ["breathing"],
        body: {
          type: "object",
          required: ["sessionType", "duration"],
          properties: {
            sessionType: {
              type: "string",
              description: "Type of breathing session",
            },
            duration: {
              type: "number",
              description: "Duration in seconds",
            },
          },
        },
        response: {
          201: {
            description: "Breathing session recorded successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              session: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  sessionType: { type: "string" },
                  duration: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          400: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, sessionType: request.body.sessionType, duration: request.body.duration },
        "Recording breathing session"
      );

      const [newSession] = await db
        .insert(breathingSessions)
        .values({
          userId: session.user.id,
          sessionType: request.body.sessionType,
          duration: request.body.duration,
        })
        .returning();

      app.logger.info({ sessionId: newSession.id }, "Breathing session recorded successfully");
      reply.code(201);
      return {
        success: true,
        session: {
          id: newSession.id,
          sessionType: newSession.sessionType,
          duration: newSession.duration,
          createdAt: newSession.createdAt,
        },
      };
    }
  );

  // GET /api/breathing-sessions - Get user's breathing sessions
  app.fastify.get(
    "/api/breathing-sessions",
    {
      schema: {
        description: "Get user's breathing sessions",
        tags: ["breathing"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                sessionType: { type: "string" },
                duration: { type: "number" },
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, "Fetching breathing sessions");

      const sessions = await db
        .select()
        .from(breathingSessions)
        .where(eq(breathingSessions.userId, session.user.id))
        .orderBy(desc(breathingSessions.createdAt));

      app.logger.info({ count: sessions.length }, "Breathing sessions fetched");
      return sessions;
    }
  );
}
