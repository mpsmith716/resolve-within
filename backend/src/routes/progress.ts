import type { App } from "../index.js";
import { breathingSessions, journalEntries } from "../db/schema/schema.js";
import { eq, and, gte, isNotNull, ne, sql } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface ProgressInsights {
  breathingSessionsThisWeek: number;
  moodCheckIns: number;
  journalEntries: number;
  mostCommonMood: string;
}

export function registerProgressRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // GET /api/progress/insights - Get user progress and recovery insights
  app.fastify.get(
    "/api/progress/insights",
    {
      schema: {
        description: "Get progress and recovery insights for authenticated user",
        tags: ["progress"],
        response: {
          200: {
            description: "Progress insights retrieved successfully",
            type: "object",
            properties: {
              breathingSessionsThisWeek: {
                type: "number",
                description: "Number of breathing sessions completed in the last 7 days",
              },
              moodCheckIns: {
                type: "number",
                description: "Total number of mood check-ins (journal entries with mood)",
              },
              journalEntries: {
                type: "number",
                description: "Total number of journal entries with content",
              },
              mostCommonMood: {
                type: "string",
                description: "Most frequently recorded mood, or 'N/A' if no moods exist",
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

      const userId = session.user.id;
      app.logger.info({ userId }, "Fetching progress insights");

      try {
        // Calculate 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Count breathing sessions from last 7 days
        const breathingSessionsResult = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(breathingSessions)
          .where(
            and(
              eq(breathingSessions.userId, userId),
              gte(breathingSessions.createdAt, sevenDaysAgo)
            )
          );

        const breathingSessionsThisWeek = breathingSessionsResult[0]?.count ?? 0;

        // 2. Count total mood check-ins (journal entries)
        const moodCheckInsResult = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(journalEntries)
          .where(eq(journalEntries.userId, userId));

        const moodCheckIns = moodCheckInsResult[0]?.count ?? 0;

        // 3. Count journal entries with content
        const journalEntriesResult = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, userId),
              isNotNull(journalEntries.content),
              ne(journalEntries.content, "")
            )
          );

        const journalEntriesCount = journalEntriesResult[0]?.count ?? 0;

        // 4. Find most common mood
        let mostCommonMood = "N/A";
        if (moodCheckIns > 0) {
          const moodCounts = await db
            .select({
              mood: journalEntries.mood,
              count: sql<number>`cast(count(*) as int)`,
            })
            .from(journalEntries)
            .where(eq(journalEntries.userId, userId))
            .groupBy(journalEntries.mood)
            .orderBy(sql`count(*) DESC`)
            .limit(1);

          if (moodCounts.length > 0 && moodCounts[0].mood) {
            mostCommonMood = moodCounts[0].mood;
          }
        }

        const insights: ProgressInsights = {
          breathingSessionsThisWeek,
          moodCheckIns,
          journalEntries: journalEntriesCount,
          mostCommonMood,
        };

        app.logger.info({ userId, insights }, "Progress insights calculated successfully");

        return insights;
      } catch (error) {
        app.logger.error({ userId, err: error }, "Failed to calculate progress insights");
        reply.code(500);
        return { error: "Failed to calculate progress insights" };
      }
    }
  );
}
