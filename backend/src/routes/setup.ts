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

  // POST /api/setup/create-reviewer - Create a test reviewer account (env-gated; no default secrets)
  app.fastify.post(
    "/api/setup/create-reviewer",
    {
      schema: {
        description: "Create a test reviewer account (requires REVIEWER_EMAIL and REVIEWER_PASSWORD env vars)",
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
          503: {
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
      const reviewerEmail = process.env.REVIEWER_EMAIL;
      const reviewerPassword = process.env.REVIEWER_PASSWORD;
      const reviewerName = process.env.REVIEWER_NAME || "App Reviewer";

      if (!reviewerEmail || !reviewerPassword) {
        app.logger.warn({}, "Reviewer setup skipped: REVIEWER_EMAIL/REVIEWER_PASSWORD not configured");
        reply.code(503);
        return { error: "Reviewer setup is not configured" };
      }

      app.logger.info({ email: reviewerEmail }, "Checking if reviewer account exists");

      try {
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
      } catch (error: unknown) {
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
