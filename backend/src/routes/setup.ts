import type { App } from "../index.js";
import { user } from "../db/schema/auth-schema.js";
import { eq } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";
import { APIError } from "@specific-dev/framework";

// Type assertion for app.auth (available after app.withAuth() is called)
type AppWithAuth = App & { auth: any };

export function registerSetupRoutes(app: App) {
  const db = app.db;
  const appWithAuth = app as AppWithAuth;

  // POST /api/setup/create-reviewer - Create a test reviewer account (one-time setup)
  app.fastify.post(
    "/api/setup/create-reviewer",
    {
      schema: {
        description: "Create a test reviewer account (one-time setup endpoint)",
        tags: ["setup"],
        response: {
          200: {
            description: "Account creation status",
            type: "object",
            properties: {
              created: { type: "boolean" },
              reason: { type: "string" },
            },
          },
          400: {
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
      const reviewerEmail = "review@resolvewithin.com";
      const reviewerPassword = "Resolve123";
      const reviewerName = "App Reviewer";

      app.logger.info({ email: reviewerEmail }, "Checking if reviewer account exists");

      try {
        // Check if reviewer account already exists
        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, reviewerEmail));

        if (existingUser) {
          app.logger.info({ email: reviewerEmail }, "Reviewer account already exists");
          return {
            created: false,
            reason: "already exists",
          };
        }

        // Create the reviewer account using Better Auth server-side API
        app.logger.info({ email: reviewerEmail }, "Creating reviewer account");

        const result = await appWithAuth.auth.api.signUpEmail({
          body: {
            email: reviewerEmail,
            password: reviewerPassword,
            name: reviewerName,
          },
        });

        if (!result.user) {
          app.logger.error({ email: reviewerEmail }, "Failed to create reviewer account - no user returned");
          reply.code(400);
          return { error: "Failed to create reviewer account" };
        }

        app.logger.info({ email: reviewerEmail, userId: result.user.id }, "Reviewer account created successfully");

        return {
          created: true,
        };
      } catch (error) {
        if (error instanceof APIError) {
          app.logger.error({ email: reviewerEmail, err: error.message }, "API error creating reviewer account");
          reply.code(error.statusCode || 400);
          return { error: error.message };
        }

        app.logger.error({ email: reviewerEmail, err: error }, "Failed to create reviewer account");
        reply.code(500);
        return { error: "Failed to create reviewer account" };
      }
    }
  );
}
