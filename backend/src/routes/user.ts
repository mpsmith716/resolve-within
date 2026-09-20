import type { App } from "../index.js";
import {
  user,
  session as authSession,
  account,
  verification,
} from "../db/schema/auth-schema.js";
import {
  journalEntries,
  postInteractions,
  communityPosts,
  breathingSessions,
  favoriteExercises,
  spotlightNominations,
  spotlightVotes,
  reportedPosts,
} from "../db/schema/schema.js";
import { eq, and, or, like } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import type { FastifyRequest, FastifyReply } from "fastify";

interface UpdatePreferencesBody {
  userType?: string;
  notificationTime?: string;
  messageStreams?: string[];
}

interface DeleteAccountBody {
  /** Required for email/password accounts — confirms identity before irreversible deletion. */
  password?: string;
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
              isAdmin: { type: "boolean" },
              userType: { type: "string" },
              notificationTime: { type: "string" },
              messageStreams: {
                type: "array",
                items: { type: "string" },
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
        isAdmin: !!userProfile.isAdmin,
        userType: userProfile.userType,
        notificationTime: userProfile.notificationTime,
        messageStreams: userProfile.messageStreams,
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

  // DELETE /api/user/data — true account deletion (app data + Better Auth identity)
  app.fastify.delete<{ Body: DeleteAccountBody }>(
    "/api/user/data",
    {
      schema: {
        description:
          "Permanently delete the authenticated user's app data and Better Auth identity/credentials so the same email/password cannot sign in again",
        tags: ["user"],
        body: {
          type: "object",
          properties: {
            password: {
              type: "string",
              description: "Required for credential (email/password) accounts",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: { error: { type: "string" } },
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
    async (request: FastifyRequest<{ Body: DeleteAccountBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Authority is the authenticated session only — never trust client-supplied userId/email
      const userId = session.user.id;
      const email = session.user.email;
      app.logger.info({ userId }, "Starting true account deletion");

      try {
        const credentialAccounts = await db
          .select()
          .from(account)
          .where(
            and(eq(account.userId, userId), eq(account.providerId, "credential"))
          );

        const credentialWithPassword = credentialAccounts.find((a: { password: string | null }) => !!a.password);

        if (credentialWithPassword?.password) {
          const password = request.body?.password;
          if (!password || typeof password !== "string") {
            reply.code(400);
            return {
              error: "Password confirmation is required to delete your account",
            };
          }
          const valid = await verifyPassword({
            hash: credentialWithPassword.password,
            password,
          });
          if (!valid) {
            reply.code(400);
            return { error: "Incorrect password. Account was not deleted." };
          }
        }

        await db.transaction(async (tx: typeof db) => {
          const deletedVotes = await tx
            .delete(spotlightVotes)
            .where(eq(spotlightVotes.voterId, userId))
            .returning();
          app.logger.info({ userId, count: deletedVotes.length }, "Deleted spotlight votes");

          const deletedNominations = await tx
            .delete(spotlightNominations)
            .where(eq(spotlightNominations.nominatorId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedNominations.length },
            "Deleted spotlight nominations"
          );

          const deletedInteractions = await tx
            .delete(postInteractions)
            .where(eq(postInteractions.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedInteractions.length },
            "Deleted post interactions"
          );

          const deletedPosts = await tx
            .delete(communityPosts)
            .where(eq(communityPosts.authorId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedPosts.length },
            "Deleted community posts"
          );

          const deletedEntries = await tx
            .delete(journalEntries)
            .where(eq(journalEntries.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedEntries.length },
            "Deleted journal entries"
          );

          const deletedBreathing = await tx
            .delete(breathingSessions)
            .where(eq(breathingSessions.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedBreathing.length },
            "Deleted breathing sessions"
          );

          const deletedFavorites = await tx
            .delete(favoriteExercises)
            .where(eq(favoriteExercises.userId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedFavorites.length },
            "Deleted favorite exercises"
          );

          // Schema: reporter_user_id is NOT NULL + ON DELETE CASCADE.
          // Without a nullable-reporter migration, reports filed by this user cannot be retained.
          // Clear notes then delete rows explicitly before identity removal.
          await tx
            .update(reportedPosts)
            .set({ notes: null })
            .where(eq(reportedPosts.reporterUserId, userId));
          const deletedReports = await tx
            .delete(reportedPosts)
            .where(eq(reportedPosts.reporterUserId, userId))
            .returning();
          app.logger.info(
            { userId, count: deletedReports.length },
            "Deleted reports filed by user (CASCADE-equivalent; see V1_DATA_DELETION.md)"
          );

          // reviewed_by is ON DELETE SET NULL — clear explicitly for clarity
          await tx
            .update(reportedPosts)
            .set({ reviewedBy: null })
            .where(eq(reportedPosts.reviewedBy, userId));

          // verification has no FK to user — remove email + delete-account tokens
          const deletedVerification = await tx
            .delete(verification)
            .where(
              or(
                eq(verification.identifier, email),
                and(
                  like(verification.identifier, "delete-account-%"),
                  eq(verification.value, userId)
                )
              )
            )
            .returning();
          app.logger.info(
            { userId, count: deletedVerification.length },
            "Deleted verification tokens"
          );

          const deletedSessions = await tx
            .delete(authSession)
            .where(eq(authSession.userId, userId))
            .returning();
          app.logger.info({ userId, count: deletedSessions.length }, "Deleted sessions");

          const deletedAccounts = await tx
            .delete(account)
            .where(eq(account.userId, userId))
            .returning();
          app.logger.info({ userId, count: deletedAccounts.length }, "Deleted accounts/credentials");

          // Identity removal — remaining app FKs CASCADE if any rows remain
          await tx.delete(user).where(eq(user.id, userId));
          app.logger.info({ userId }, "Deleted Better Auth user identity");
        });

        app.logger.info({ userId }, "True account deletion completed successfully");

        return {
          success: true,
          message: "Account and all user data permanently deleted",
        };
      } catch (error) {
        app.logger.error({ userId, err: error }, "Failed to delete account");
        reply.code(500);
        return { error: "Failed to delete account. Nothing was finalized; please try again." };
      }
    }
  );
}
