import type { App } from "../index.js";
import { favoriteExercises } from "../db/schema/schema.js";
import { eq, desc, and } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface AddFavoriteBody {
  exerciseId: string;
}

export function registerFavoritesRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // POST /api/favorites - Add exercise to favorites
  app.fastify.post<{ Body: AddFavoriteBody }>(
    "/api/favorites",
    {
      schema: {
        description: "Add a breathing exercise to favorites",
        tags: ["favorites"],
        body: {
          type: "object",
          required: ["exerciseId"],
          properties: {
            exerciseId: {
              type: "string",
              description: "ID of the breathing exercise",
            },
          },
        },
        response: {
          201: {
            description: "Exercise added to favorites successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              favorite: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  exerciseId: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
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
    async (request: FastifyRequest<{ Body: AddFavoriteBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, exerciseId: request.body.exerciseId },
        "Adding exercise to favorites"
      );

      const [favorite] = await db
        .insert(favoriteExercises)
        .values({
          userId: session.user.id,
          exerciseId: request.body.exerciseId,
        })
        .returning();

      app.logger.info({ favoriteId: favorite.id }, "Exercise added to favorites successfully");
      reply.code(201);
      return {
        success: true,
        favorite: {
          id: favorite.id,
          exerciseId: favorite.exerciseId,
          createdAt: favorite.createdAt,
        },
      };
    }
  );

  // GET /api/favorites - Get user's favorite exercises
  app.fastify.get(
    "/api/favorites",
    {
      schema: {
        description: "Get user's favorite breathing exercises",
        tags: ["favorites"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                exerciseId: { type: "string" },
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

      app.logger.info({ userId: session.user.id }, "Fetching favorite exercises");

      const favorites = await db
        .select()
        .from(favoriteExercises)
        .where(eq(favoriteExercises.userId, session.user.id))
        .orderBy(desc(favoriteExercises.createdAt));

      app.logger.info({ count: favorites.length }, "Favorite exercises fetched");
      return favorites;
    }
  );

  // DELETE /api/favorites/:exerciseId - Remove exercise from favorites
  app.fastify.delete<{ Params: { exerciseId: string } }>(
    "/api/favorites/:exerciseId",
    {
      schema: {
        description: "Remove a breathing exercise from favorites",
        tags: ["favorites"],
        params: {
          type: "object",
          required: ["exerciseId"],
          properties: {
            exerciseId: { type: "string", description: "Exercise ID to remove from favorites" },
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
          404: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { exerciseId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, exerciseId: request.params.exerciseId },
        "Removing exercise from favorites"
      );

      // Check if favorite exists
      const [favorite] = await db
        .select()
        .from(favoriteExercises)
        .where(
          and(
            eq(favoriteExercises.userId, session.user.id),
            eq(favoriteExercises.exerciseId, request.params.exerciseId)
          )
        );

      if (!favorite) {
        app.logger.warn({ exerciseId: request.params.exerciseId }, "Favorite not found");
        reply.code(404);
        return { error: "Favorite not found" };
      }

      await db.delete(favoriteExercises).where(eq(favoriteExercises.id, favorite.id));

      app.logger.info({ exerciseId: request.params.exerciseId }, "Exercise removed from favorites successfully");
      return { success: true };
    }
  );
}
