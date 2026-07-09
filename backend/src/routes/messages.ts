import type { App } from "../index.js";
import { dailyMessages } from "../db/schema/schema.js";
import { user } from "../db/schema/auth-schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface MessagesQuerystring {
  limit?: number;
}

// Type assertion for app.auth (available after app.withAuth() is called)
type AppWithAuth = App & { auth: any };

export function registerMessagesRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;
  const appWithAuth = app as AppWithAuth;

  // GET /api/messages/daily - Get today's message (public endpoint, optionally filtered by user preferences)
  app.fastify.get(
    "/api/messages/daily",
    {
      schema: {
        description: "Get today's message (public endpoint, optionally filtered by user preferences if authenticated)",
        tags: ["messages"],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              content: { type: "string" },
              stream: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
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
      app.logger.info({}, "Fetching daily message");

      // Get today's date (as a Date object representing 00:00 UTC)
      const now = new Date();
      const todayDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      // Find available messages for today
      const messages = await db
        .select()
        .from(dailyMessages)
        .where(eq(dailyMessages.date, todayDate));

      if (messages.length === 0) {
        app.logger.warn({ date: todayDate }, "No messages found for today");
        reply.code(404);
        return { error: "No message available for today" };
      }

      // Try to get session for filtering by user preferences
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) {
          headers.append(key, Array.isArray(value) ? value[0] : value);
        }
      });

      let availableMessages = messages;
      try {
        const session = await appWithAuth.auth.api.getSession({ headers });
        if (session?.user?.id) {
          app.logger.info({ userId: session.user.id }, "Fetching daily message for authenticated user");
          const [userProfile] = await db.select().from(user).where(eq(user.id, session.user.id));
          if (userProfile?.messageStreams) {
            const messageStreams = userProfile.messageStreams as any[];
            availableMessages = messages.filter((m) => messageStreams.includes(m.stream));
            app.logger.info({ userId: session.user.id, streamCount: availableMessages.length }, "Filtered messages by user streams");
          }
        }
      } catch {
        // Not authenticated, return from all available messages
        app.logger.debug({}, "No authentication, returning from all available messages");
      }

      if (availableMessages.length === 0) {
        app.logger.warn({ date: todayDate }, "No messages found matching criteria");
        reply.code(404);
        return { error: "No message available for today" };
      }

      // Return random message
      const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];

      app.logger.info({ messageId: message.id, stream: message.stream }, "Daily message fetched");
      return message;
    }
  );

  // GET /api/messages/history - Get recent daily messages
  app.fastify.get<{ Querystring: MessagesQuerystring }>(
    "/api/messages/history",
    {
      schema: {
        description: "Get recent daily messages",
        tags: ["messages"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 30 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                content: { type: "string" },
                stream: { type: "string" },
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
    async (request: FastifyRequest<{ Querystring: MessagesQuerystring }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(request.query.limit ?? 30, 100);

      app.logger.info({ userId: session.user.id, limit }, "Fetching message history");

      const messages = await db
        .select()
        .from(dailyMessages)
        .orderBy(desc(dailyMessages.date))
        .limit(limit);

      app.logger.info({ count: messages.length }, "Message history fetched");
      return messages;
    }
  );
}
