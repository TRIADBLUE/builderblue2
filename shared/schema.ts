import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role").notNull().default("builder"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Refresh Tokens ──────────────────────────────────────────────────────────

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Magic Links ─────────────────────────────────────────────────────────────

export const magicLinks = pgTable("magic_links", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  repoName: text("repo_name"),
  repoBranch: text("repo_branch").default("main"),
  lastBuiltAt: timestamp("last_built_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  swipesblueSubscriptionId: text("swipesblue_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Compute Usage ───────────────────────────────────────────────────────────

export const computeUsage = pgTable("compute_usage", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  sessionsUsed: integer("sessions_used").default(0),
  sessionsAllowed: integer("sessions_allowed").notNull(),
  blocksPurchased: integer("blocks_purchased").default(0),
  consecutiveBlockMonths: integer("consecutive_block_months").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Compute Blocks ──────────────────────────────────────────────────────────

export const computeBlocks = pgTable("compute_blocks", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blockSize: text("block_size").notNull(),
  sessionsAdded: integer("sessions_added").notNull(),
  amountPaid: integer("amount_paid").notNull(),
  swipesblueTransactionId: text("swipesblue_transaction_id"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  neverExpires: boolean("never_expires").default(true),
});

// ─── Project Files ──────────────────────────────────────────────────────────

export const projectFiles = pgTable("project_files", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull(),
  language: text("language").notNull(),
  lastModifiedBy: text("last_modified_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Conversations ──────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Staged Changes ────────────────────────────────────────────────────────

export const stagedChanges = pgTable("staged_changes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  filePath: text("file_path").notNull(),
  originalContent: text("original_content"),
  proposedContent: text("proposed_content").notNull(),
  diff: text("diff").notNull(),
  status: text("status").notNull().default("pending_review"),
  proposedBy: text("proposed_by").notNull(),
  architectReview: text("architect_review"),
  architectReviewNote: text("architect_review_note"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  committedAt: timestamp("committed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Deployments ────────────────────────────────────────────────────────────

export const deployments = pgTable("deployments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  target: text("target").notNull(),
  status: text("status").notNull().default("pending"),
  buildLog: text("build_log"),
  deployedUrl: text("deployed_url"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Project Secrets ────────────────────────────────────────────────────────

export const projectSecrets = pgTable("project_secrets", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── AI Usage ───────────────────────────────────────────────────────────────

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Billing Cycles ─────────────────────────────────────────────────────────

export const billingCycles = pgTable("billing_cycles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  attemptCount: integer("attempt_count").default(0),
  nextAttemptAt: timestamp("next_attempt_at"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
