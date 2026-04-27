import type { App } from "../index.js";
import { user } from "../db/schema/auth-schema.js";
import { journalEntries, postInteractions, communityPosts } from "../db/schema/schema.js";
import { eq } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";

interface UpdatePreferencesBody {
  userType?: string;
  notificationTime?: string;
  messageStreams?: string[];
}

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  // GET /api/user/profile - Get current user profile
  app.fastify.get(
    "/api/user/profile",
    {
      schema: {
        description: "Get current user profile",
        tags: ["user"],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              userType: { type: "string" },
              notificationTime: { type: "string" },
              messageStreams: {
                type: "array",
                items: { type: "string" },
              },
              badgeTier: { type: "string" },
              showBadge: { type: "boolean" },
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

      app.logger.info({ userId: session.user.id }, "Fetching user profile");

      const [userProfile] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id));

      if (!userProfile) {
        app.logger.error({ userId: session.user.id }, "User profile not found");
        reply.code(404);
        return { error: "User not found" };
      }

      const profile = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        userType: userProfile.userType,
        notificationTime: userProfile.notificationTime,
        messageStreams: userProfile.messageStreams,
        badgeTier: userProfile.badgeTier,
        showBadge: userProfile.showBadge,
      };

      app.logger.info({ userId: session.user.id }, "User profile fetched successfully");
      return profile;
    }
  );

  // PUT /api/user/preferences - Update user preferences
  app.fastify.put<{ Body: UpdatePreferencesBody }>(
    "/api/user/preferences",
    {
      schema: {
        description: "Update user preferences",
        tags: ["user"],
        body: {
          type: "object",
          properties: {
            userType: {
              type: "string",
              enum: ["veteran", "civilian", "prefer_not_to_say"],
            },
            notificationTime: { type: "string" },
            messageStreams: {
              type: "array",
              items: {
                type: "string",
                enum: ["mental_health", "veteran", "faith"],
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              userType: { type: "string" },
              notificationTime: { type: "string" },
              messageStreams: {
                type: "array",
                items: { type: "string" },
              },
              badgeTier: { type: "string" },
              showBadge: { type: "boolean" },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdatePreferencesBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, "Updating user preferences");

      const updates: Record<string, any> = {};
      if (request.body.userType !== undefined) updates.userType = request.body.userType;
      if (request.body.notificationTime !== undefined) updates.notificationTime = request.body.notificationTime;
      if (request.body.messageStreams !== undefined) updates.messageStreams = request.body.messageStreams;

      const [updatedUser] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, session.user.id))
        .returning();

      const preferences = {
        id: updatedUser.id,
        userType: updatedUser.userType,
        notificationTime: updatedUser.notificationTime,
        messageStreams: updatedUser.messageStreams,
        badgeTier: updatedUser.badgeTier,
        showBadge: updatedUser.showBadge,
      };

      app.logger.info({ userId: session.user.id }, "User preferences updated successfully");
      return preferences;
    }
  );

  // GET /api/user/disclaimer-status - Check if user has accepted disclaimer
  app.fastify.get(
    "/api/user/disclaimer-status",
    {
      schema: {
        description: "Check if user has accepted the crisis disclaimer",
        tags: ["user"],
        response: {
          200: {
            type: "object",
            properties: {
              accepted: { type: "boolean" },
              acceptedAt: { type: "string", format: "date-time" },
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

      app.logger.info({ userId: session.user.id }, "Fetching disclaimer status");

      const [userProfile] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id));

      if (!userProfile) {
        app.logger.error({ userId: session.user.id }, "User not found");
        reply.code(404);
        return { error: "User not found" };
      }

      const response = {
        accepted: !!userProfile.disclaimerAcceptedAt,
        acceptedAt: userProfile.disclaimerAcceptedAt,
      };

      app.logger.info({ userId: session.user.id, accepted: response.accepted }, "Disclaimer status fetched");
      return response;
    }
  );

  // POST /api/user/disclaimer-accept - Record disclaimer acceptance
  app.fastify.post(
    "/api/user/disclaimer-accept",
    {
      schema: {
        description: "Record that user has accepted the crisis disclaimer",
        tags: ["user"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              acceptedAt: { type: "string", format: "date-time" },
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

      app.logger.info({ userId: session.user.id }, "Recording disclaimer acceptance");

      const [updatedUser] = await db
        .update(user)
        .set({ disclaimerAcceptedAt: new Date() })
        .where(eq(user.id, session.user.id))
        .returning();

      app.logger.info({ userId: session.user.id, acceptedAt: updatedUser.disclaimerAcceptedAt }, "Disclaimer accepted");

      return {
        success: true,
        acceptedAt: updatedUser.disclaimerAcceptedAt,
      };
    }
  );

  // DELETE /api/user/data - Delete all user data
  app.fastify.delete(
    "/api/user/data",
    {
      schema: {
        description: "Delete all user data (journal entries, posts, interactions)",
        tags: ["user"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          500: {
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
      app.logger.info({ userId }, "Starting user data deletion");

      try {
        // Delete in a transaction to ensure all-or-nothing
        await db.transaction(async (tx) => {
          // Delete post interactions (by userId)
          const deletedInteractions = await tx
            .delete(postInteractions)
            .where(eq(postInteractions.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedInteractions.length },
            "Deleted post interactions"
          );

          // Delete community posts (by authorId)
          const deletedPosts = await tx
            .delete(communityPosts)
            .where(eq(communityPosts.authorId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedPosts.length },
            "Deleted community posts"
          );

          // Delete journal entries (by userId)
          const deletedEntries = await tx
            .delete(journalEntries)
            .where(eq(journalEntries.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedEntries.length },
            "Deleted journal entries"
          );
        });

        app.logger.info({ userId }, "User data deletion completed successfully");

        return {
          success: true,
          message: "All user data deleted successfully",
        };
      } catch (error) {
        app.logger.error({ userId, err: error }, "Failed to delete user data");
        reply.code(500);
        return { error: "Failed to delete user data" };
      }
    }
  );
}
