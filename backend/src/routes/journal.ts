import type { App } from "../index.js";
import { journalEntries } from "../db/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CreateJournalBody {
  mood: "cloudy" | "onEdge" | "numb" | "heavy" | "light";
  content?: string;
}

interface JournalQuerystring {
  limit?: number;
  offset?: number;
}

export function registerJournalRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // POST /api/journal - Create journal entry
  app.fastify.post<{ Body: CreateJournalBody }>(
    "/api/journal",
    {
      schema: {
        description: "Create a new journal entry",
        tags: ["journal"],
        body: {
          type: "object",
          required: ["mood"],
          properties: {
            mood: {
              type: "string",
              enum: ["cloudy", "onEdge", "numb", "heavy", "light"],
              description: "Mood of the entry",
            },
            content: {
              type: "string",
              description: "Optional journal content",
            },
          },
        },
        response: {
          201: {
            description: "Journal entry created successfully",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string" },
              mood: { type: "string" },
              content: { type: "string" },
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
    async (request: FastifyRequest<{ Body: CreateJournalBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id, mood: request.body.mood }, "Creating journal entry");

      const [entry] = await db
        .insert(journalEntries)
        .values({
          userId: session.user.id,
          mood: request.body.mood,
          content: request.body.content,
        })
        .returning();

      app.logger.info({ entryId: entry.id }, "Journal entry created successfully");
      reply.code(201);
      return entry;
    }
  );

  // GET /api/journal - Get user's journal entries
  app.fastify.get<{ Querystring: JournalQuerystring }>(
    "/api/journal",
    {
      schema: {
        description: "Get user's journal entries",
        tags: ["journal"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50, description: "Max results" },
            offset: { type: "number", default: 0, description: "Skip results" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                mood: { type: "string" },
                content: { type: "string" },
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
    async (request: FastifyRequest<{ Querystring: JournalQuerystring }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(request.query.limit ?? 50, 100);
      const offset = request.query.offset ?? 0;

      app.logger.info({ userId: session.user.id, limit, offset }, "Fetching journal entries");

      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, session.user.id))
        .orderBy(desc(journalEntries.createdAt))
        .limit(limit)
        .offset(offset);

      app.logger.info({ count: entries.length }, "Journal entries fetched");
      return entries;
    }
  );

  // GET /api/journal/trends - Get mood trends
  app.fastify.get(
    "/api/journal/trends",
    {
      schema: {
        description: "Get mood trends and statistics",
        tags: ["journal"],
        response: {
          200: {
            type: "object",
            properties: {
              moods: {
                type: "object",
                additionalProperties: { type: "number" },
              },
              streak: { type: "number" },
              totalEntries: { type: "number" },
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

      app.logger.info({ userId: session.user.id }, "Fetching journal trends");

      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, session.user.id))
        .orderBy(desc(journalEntries.createdAt));

      // Count moods
      const moodCounts: Record<string, number> = {};
      for (const entry of entries) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1;
      }

      // Calculate streak (consecutive days with entries)
      let streak = 0;
      if (entries.length > 0) {
        let currentDate = new Date(entries[0].createdAt);
        streak = 1;

        for (let i = 1; i < entries.length; i++) {
          const entryDate = new Date(entries[i].createdAt);
          const diffTime = currentDate.getTime() - entryDate.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          if (diffDays >= 1 && diffDays < 2) {
            streak++;
            currentDate = entryDate;
          } else {
            break;
          }
        }
      }

      const trends = {
        moods: moodCounts,
        streak,
        totalEntries: entries.length,
      };

      app.logger.info(trends, "Journal trends calculated");
      return trends;
    }
  );

  // DELETE /api/journal/:id - Delete journal entry
  app.fastify.delete<{ Params: { id: string } }>(
    "/api/journal/:id",
    {
      schema: {
        description: "Delete a journal entry",
        tags: ["journal"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid", description: "Entry ID" },
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

      app.logger.info({ userId: session.user.id, entryId: request.params.id }, "Deleting journal entry");

      const entry = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, request.params.id))
        .limit(1);

      if (!entry.length) {
        app.logger.warn({ entryId: request.params.id }, "Journal entry not found");
        reply.code(404);
        return { error: "Entry not found" };
      }

      if (entry[0].userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, entryId: request.params.id }, "Unauthorized delete attempt");
        reply.code(403);
        return { error: "Not authorized to delete this entry" };
      }

      await db.delete(journalEntries).where(eq(journalEntries.id, request.params.id));

      app.logger.info({ entryId: request.params.id }, "Journal entry deleted successfully");
      return { success: true };
    }
  );

  // GET /api/journal/export - Export journal entries as JSON
  app.fastify.get(
    "/api/journal/export",
    {
      schema: {
        description: "Export all journal entries as JSON",
        tags: ["journal"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                mood: { type: "string" },
                content: { type: "string" },
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

      app.logger.info({ userId: session.user.id }, "Exporting journal entries");

      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, session.user.id))
        .orderBy(desc(journalEntries.createdAt));

      app.logger.info({ count: entries.length }, "Journal entries exported");
      return entries;
    }
  );
}
