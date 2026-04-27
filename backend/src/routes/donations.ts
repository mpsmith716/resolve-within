import type { App } from "../index.js";
import { donations } from "../db/schema/schema.js";
import { user } from "../db/schema/auth-schema.js";
import { eq, desc } from "drizzle-orm";
import type { FastifyRequest, FastifyReply } from "fastify";
import Stripe from "stripe";

interface CreatePaymentIntentBody {
  amount: number;
  tier: "champion" | "ally" | "friend";
  isRecurring?: boolean;
  isAnonymous?: boolean;
}

interface ConfirmDonationBody {
  paymentIntentId: string;
  tier: "champion" | "ally" | "friend";
}

interface DonationsQuerystring {
  limit?: number;
  offset?: number;
}

export function registerDonationRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const db = app.db;

  const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  // POST /api/donations/create-payment-intent - Create Stripe payment intent
  app.fastify.post<{ Body: CreatePaymentIntentBody }>(
    "/api/donations/create-payment-intent",
    {
      schema: {
        description: "Create a Stripe payment intent for donations",
        tags: ["donations"],
        body: {
          type: "object",
          required: ["amount", "tier"],
          properties: {
            amount: {
              type: "number",
              description: "Amount in dollars (will be converted to cents)",
            },
            tier: {
              type: "string",
              enum: ["champion", "ally", "friend"],
            },
            isRecurring: { type: "boolean", default: false },
            isAnonymous: { type: "boolean", default: false },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              clientSecret: { type: "string" },
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
    async (request: FastifyRequest<{ Body: CreatePaymentIntentBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, amount: request.body.amount, tier: request.body.tier },
        "Creating Stripe payment intent"
      );

      try {
        if (!stripe) {
          app.logger.warn({ userId: session.user.id }, "Stripe not configured");
          reply.code(400);
          return { error: "Payment processing not configured" };
        }

        // Convert dollars to cents
        const amountInCents = Math.round(request.body.amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          metadata: {
            userId: session.user.id,
            tier: request.body.tier,
            isRecurring: String(request.body.isRecurring || false),
            isAnonymous: String(request.body.isAnonymous || false),
          },
        });

        app.logger.info({ paymentIntentId: paymentIntent.id }, "Payment intent created");

        return {
          clientSecret: paymentIntent.client_secret,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, "Failed to create payment intent");
        reply.code(400);
        return { error: "Failed to create payment intent" };
      }
    }
  );

  // POST /api/donations/confirm - Confirm payment and update user badge
  app.fastify.post<{ Body: ConfirmDonationBody }>(
    "/api/donations/confirm",
    {
      schema: {
        description: "Confirm donation payment and update user badge",
        tags: ["donations"],
        body: {
          type: "object",
          required: ["paymentIntentId", "tier"],
          properties: {
            paymentIntentId: { type: "string" },
            tier: {
              type: "string",
              enum: ["champion", "ally", "friend"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              badgeTier: { type: "string" },
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
    async (request: FastifyRequest<{ Body: ConfirmDonationBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, paymentIntentId: request.body.paymentIntentId },
        "Confirming donation payment"
      );

      try {
        if (!stripe) {
          app.logger.warn({ userId: session.user.id }, "Stripe not configured");
          reply.code(400);
          return { error: "Payment processing not configured" };
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(request.body.paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
          app.logger.warn({ paymentIntentId: request.body.paymentIntentId }, "Payment not succeeded");
          reply.code(400);
          return { error: "Payment not completed" };
        }

        // Create donation record
        const [donation] = await db
          .insert(donations)
          .values({
            userId: session.user.id,
            amount: paymentIntent.amount,
            tier: request.body.tier,
            isRecurring: paymentIntent.metadata?.isRecurring === "true",
            isAnonymous: paymentIntent.metadata?.isAnonymous === "true",
            stripePaymentId: paymentIntent.id,
          })
          .returning();

        // Update user badge tier
        const [updatedUser] = await db
          .update(user)
          .set({ badgeTier: request.body.tier })
          .where(eq(user.id, session.user.id))
          .returning();

        app.logger.info({ donationId: donation.id, tier: request.body.tier }, "Donation confirmed successfully");

        return {
          success: true,
          badgeTier: updatedUser.badgeTier,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, "Failed to confirm donation");
        reply.code(400);
        return { error: "Failed to confirm donation" };
      }
    }
  );

  // GET /api/donations/history - Get user's donation history
  app.fastify.get<{ Querystring: DonationsQuerystring }>(
    "/api/donations/history",
    {
      schema: {
        description: "Get user's donation history",
        tags: ["donations"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                amount: { type: "number" },
                tier: { type: "string" },
                isRecurring: { type: "boolean" },
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
    async (request: FastifyRequest<{ Querystring: DonationsQuerystring }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(request.query.limit ?? 50, 100);
      const offset = request.query.offset ?? 0;

      app.logger.info({ userId: session.user.id, limit, offset }, "Fetching donation history");

      const donationHistory = await db
        .select()
        .from(donations)
        .where(eq(donations.userId, session.user.id))
        .orderBy(desc(donations.createdAt))
        .limit(limit)
        .offset(offset);

      app.logger.info({ count: donationHistory.length }, "Donation history fetched");
      return donationHistory;
    }
  );
}
