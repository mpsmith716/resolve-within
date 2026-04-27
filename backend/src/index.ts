import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';

// Import route registration functions
import { registerJournalRoutes } from './routes/journal.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerSpotlightRoutes } from './routes/spotlight.js';
import { registerUserRoutes } from './routes/user.js';
import { registerMessagesRoutes } from './routes/messages.js';
import { registerDonationRoutes } from './routes/donations.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerBreathingRoutes } from './routes/breathing.js';
import { registerFavoritesRoutes } from './routes/favorites.js';
import { registerCrisisRoutes } from './routes/crisis.js';
import { registerProgressRoutes } from './routes/progress.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
app.withAuth();

// Register routes
registerJournalRoutes(app);
registerCommunityRoutes(app);
registerSpotlightRoutes(app);
registerUserRoutes(app);
registerMessagesRoutes(app);
registerDonationRoutes(app);
registerAdminRoutes(app);
registerBreathingRoutes(app);
registerFavoritesRoutes(app);
registerCrisisRoutes(app);
registerProgressRoutes(app);

await app.run();
app.logger.info('Application running');
