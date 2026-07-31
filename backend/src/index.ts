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

// Enable authentication with Better Auth
app.withAuth({
  trustedOrigins: [
    "resolvewithin://",
    "resolvewithin://*",
    "exp://",
    "exp://**",
    "exp://192.168.*.*:*/**",
  ],
  plugins: [expo()],
});

// Seed reviewer account on startup

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
