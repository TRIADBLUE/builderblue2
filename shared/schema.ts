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
  visibility: text("visibility").notNull().default("private"),
  customDomain: text("custom_domain"),
  subdomain: text("subdomain"),
  folderId: uuid("folder_id"),
  lastBuiltAt: timestamp("last_built_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Project Folders ─────────────────────────────────────────────────────────

export const projectFolders = pgTable("project_folders", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#4A90D9"),
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

// ─── Project Collaborators ─────────────────────────────────────────────────

export const projectCollaborators = pgTable("project_collaborators", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("editor"),
  invitedBy: uuid("invited_by").references(() => users.id),
  invitedEmail: text("invited_email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Project Memory ──────────────────────────────────────────────────────────
// Persistent per-project storage: style guide, design decisions, brand rules.
// Both AIs read this at the start of every session.

export const projectMemory = pgTable("project_memory", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: jsonb("value").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Project TODOs ───────────────────────────────────────────────────────────

export const projectTodos = pgTable("project_todos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  priority: integer("priority").notNull().default(0),
  source: text("source").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Thread Entries ──────────────────────────────────────────────────────────

export const threadEntries = pgTable("thread_entries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  action: text("action").notNull(),
  content: text("content").notNull(),
  filePath: text("file_path"),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  stagedChangeId: uuid("staged_change_id").references(() => stagedChanges.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Session Summaries ───────────────────────────────────────────────────────

export const sessionSummaries = pgTable("session_summaries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  role: text("role").notNull(),
  summary: text("summary").notNull(),
  keyDecisions: jsonb("key_decisions").notNull().default(sql`'[]'::jsonb`),
  openItems: jsonb("open_items").notNull().default(sql`'[]'::jsonb`),
  filesModified: jsonb("files_modified").notNull().default(sql`'[]'::jsonb`),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
