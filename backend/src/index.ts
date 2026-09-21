import { createApplication } from "@specific-dev/framework";
import { expo } from "@better-auth/expo";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { eq } from 'drizzle-orm';
import { user } from './db/schema/auth-schema.js';

// Import route registration functions
import { registerJournalRoutes } from './routes/journal.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerSpotlightRoutes } from './routes/spotlight.js';
import { registerUserRoutes } from './routes/user.js';
import { registerMessagesRoutes } from './routes/messages.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerBreathingRoutes } from './routes/breathing.js';
import { registerFavoritesRoutes } from './routes/favorites.js';
import { registerCrisisRoutes } from './routes/crisis.js';
import { registerProgressRoutes } from './routes/progress.js';
import { registerSetupRoutes } from './routes/setup.js';
import { registerReportRoutes } from './routes/reports.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Type assertion for app.auth (available after app.withAuth() is called)
type AppWithAuth = App & { auth: any };

// Enable authentication with Better Auth (Expo / native trusted origins)
app.withAuth({
  trustedOrigins: [
    "resolvewithin://",
    "resolvewithin://*",
    "exp://",
    "exp://**",
    "exp://192.168.*.*:*/**",
  ],
  plugins: [expo()],
  // Enables Better Auth POST /api/auth/delete-user (test cleanup + optional client path).
  // Primary product deletion remains DELETE /api/user/data (transactional app + identity wipe).
  user: {
    deleteUser: {
      enabled: true,
    },
  },
});

// Optionally seed reviewer account when REVIEWER_EMAIL + REVIEWER_PASSWORD are set (no default secrets)
{
  const reviewerEmail = process.env.REVIEWER_EMAIL;
  const reviewerPassword = process.env.REVIEWER_PASSWORD;
  if (reviewerEmail && reviewerPassword) {
    const db = app.db;
    const appWithAuth = app as AppWithAuth;
    try {
      const [existingReviewer] = await db
        .select()
        .from(user)
        .where(eq(user.email, reviewerEmail));

      if (!existingReviewer) {
        app.logger.info({}, '[seed] Creating reviewer account from env');
        await appWithAuth.auth.api.signUpEmail({
          body: {
            email: reviewerEmail,
            password: reviewerPassword,
            name: process.env.REVIEWER_NAME || 'App Reviewer',
          },
        });
        app.logger.info({}, '[seed] Reviewer account created');
      } else {
        app.logger.info({}, '[seed] Reviewer account already exists');
      }
    } catch (error) {
      app.logger.error({ err: error }, '[seed] Failed to seed reviewer account - continuing startup');
    }
  } else {
    app.logger.info({}, '[seed] Skipping reviewer seed (REVIEWER_EMAIL/REVIEWER_PASSWORD not set)');
  }
}

// Register routes
registerJournalRoutes(app);
registerCommunityRoutes(app);
registerSpotlightRoutes(app);
registerUserRoutes(app);
registerMessagesRoutes(app);
registerAdminRoutes(app);
registerBreathingRoutes(app);
registerFavoritesRoutes(app);
registerCrisisRoutes(app);
registerProgressRoutes(app);
registerSetupRoutes(app);
registerReportRoutes(app);

await app.run();
app.logger.info('Application running');
