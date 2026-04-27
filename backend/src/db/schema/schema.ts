import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { relations } from "drizzle-orm";

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  mood: text("mood", { enum: ["cloudy", "onEdge", "numb", "heavy", "light"] }).notNull(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  author: one(user, {
    fields: [journalEntries.userId],
    references: [user.id],
  }),
}));

// Community Posts
export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  isAnonymous: boolean("is_anonymous").default(true),
  community: text("community", { enum: ["veteran", "healing_together"] }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  likeCount: integer("like_count").default(0),
  encourageCount: integer("encourage_count").default(0),
  flagCount: integer("flag_count").default(0),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(user, {
    fields: [communityPosts.authorId],
    references: [user.id],
  }),
  interactions: many(postInteractions),
  nominations: many(spotlightNominations),
}));

// Post Interactions (likes, encourages, flags)
export const postInteractions = pgTable(
  "post_interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["like", "encourage", "flag"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("post_interactions_unique_idx").on(table.postId, table.userId, table.type),
  ]
);

export const postInteractionsRelations = relations(postInteractions, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postInteractions.postId],
    references: [communityPosts.id],
  }),
  user: one(user, {
    fields: [postInteractions.userId],
    references: [user.id],
  }),
}));

// Spotlight Nominations
export const spotlightNominations = pgTable(
  "spotlight_nominations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    nominatorId: text("nominator_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("spotlight_nominations_unique_idx").on(table.postId, table.nominatorId, table.weekStart),
  ]
);

export const spotlightNominationsRelations = relations(spotlightNominations, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [spotlightNominations.postId],
    references: [communityPosts.id],
  }),
  nominator: one(user, {
    fields: [spotlightNominations.nominatorId],
    references: [user.id],
  }),
  votes: many(spotlightVotes),
}));

// Spotlight Votes
export const spotlightVotes = pgTable(
  "spotlight_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nominationId: uuid("nomination_id").notNull().references(() => spotlightNominations.id, { onDelete: "cascade" }),
    voterId: text("voter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("spotlight_votes_unique_idx").on(table.nominationId, table.voterId),
  ]
);

export const spotlightVotesRelations = relations(spotlightVotes, ({ one }) => ({
  nomination: one(spotlightNominations, {
    fields: [spotlightVotes.nominationId],
    references: [spotlightNominations.id],
  }),
  voter: one(user, {
    fields: [spotlightVotes.voterId],
    references: [user.id],
  }),
}));

// Spotlight Winners
export const spotlightWinners = pgTable(
  "spotlight_winners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull().unique(),
    voteCount: integer("vote_count").notNull(),
    announcedAt: timestamp("announced_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const spotlightWinnersRelations = relations(spotlightWinners, ({ one }) => ({
  post: one(communityPosts, {
    fields: [spotlightWinners.postId],
    references: [communityPosts.id],
  }),
}));

// Daily Messages
export const dailyMessages = pgTable("daily_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  stream: text("stream", { enum: ["veteran", "mental_health", "faith"] }).notNull(),
  date: date("date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Donations
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in cents
  tier: text("tier", { enum: ["champion", "ally", "friend"] }).notNull(),
  isRecurring: boolean("is_recurring").default(false),
  isAnonymous: boolean("is_anonymous").default(false),
  stripePaymentId: text("stripe_payment_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(user, {
    fields: [donations.userId],
    references: [user.id],
  }),
}));

// Admin Actions
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: text("admin_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["hide_post", "unhide_post", "delete_post", "ban_user"] }).notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(user, {
    fields: [adminActions.adminId],
    references: [user.id],
  }),
}));

// Breathing Sessions
export const breathingSessions = pgTable("breathing_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(),
  duration: integer("duration").notNull(), // in seconds
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const breathingSessionsRelations = relations(breathingSessions, ({ one }) => ({
  user: one(user, {
    fields: [breathingSessions.userId],
    references: [user.id],
  }),
}));

// Favorite Exercises
export const favoriteExercises = pgTable("favorite_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favoriteExercisesRelations = relations(favoriteExercises, ({ one }) => ({
  user: one(user, {
    fields: [favoriteExercises.userId],
    references: [user.id],
  }),
}));
