// ─── Onboarding ─────────────────────────────────────────────────────────────

export type BusinessIndustry =
  | "restaurant"
  | "retail"
  | "professional-services"
  | "construction"
  | "health-wellness"
  | "home-services"
  | "automotive"
  | "real-estate"
  | "creative-agency"
  | "other";

export type PrimaryGoal =
  | "get-found-online"
  | "sell-products"
  | "book-appointments"
  | "showcase-portfolio"
  | "build-internal-tool"
  | "launch-saas"
  | "other";

export interface OnboardingInput {
  businessIndustry: BusinessIndustry;
  primaryGoal: PrimaryGoal;
}

export interface AICombo {
  id: string;
  label: string;
  architectProvider: AIProvider;
  architectModel: string;
  builderProvider: AIProvider;
  builderModel: string;
  reason: string;
  recommended: boolean;
}

export interface AIModelConfig {
  provider: string;
  model: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "builder";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessIndustry: BusinessIndustry | null;
  primaryGoal: PrimaryGoal | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessIndustry: BusinessIndustry | null;
  primaryGoal: PrimaryGoal | null;
  onboardingCompletedAt: string | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface MagicLinkRequestInput {
  email: string;
}

export interface SsoPayload {
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  repoName: string | null;
  repoBranch: string;
  defaultArchitectConfig: AIModelConfig | null;
  defaultBuilderConfig: AIModelConfig | null;
  lastBuiltAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type PlanId = "solo" | "builder" | "studio" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  swipesblueSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Compute ─────────────────────────────────────────────────────────────────

export type BlockSize = "small" | "medium" | "large";

export interface ComputeUsage {
  id: string;
  userId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  sessionsUsed: number;
  sessionsAllowed: number;
  blocksPurchased: number;
  consecutiveBlockMonths: number;
}

export interface ComputeBlock {
  id: string;
  userId: string;
  blockSize: BlockSize;
  sessionsAdded: number;
  amountPaid: number;
  swipesblueTransactionId: string | null;
  purchasedAt: string;
  neverExpires: boolean;
}

// ─── Project Files ───────────────────────────────────────────────────────────

export type FileModifiedBy = "user" | "architect" | "builder";

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  language: string;
  lastModifiedBy: FileModifiedBy;
  createdAt: string;
  updatedAt: string;
}

// ─── Conversations ──────────────────────────────────────────────────────────

export type ConversationRole = "architect" | "builder";
export type AIProvider = "claude" | "deepseek" | "gemini" | "kimi" | "groq";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  userId: string;
  role: ConversationRole;
  provider: AIProvider;
  model: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Staged Changes ────────────────────────────────────────────────────────

export type StagedChangeStatus = "pending_review" | "pending" | "approved" | "rejected" | "committed";
export type ArchitectReviewStatus = "reviewing" | "approved" | "rejected" | null;
export type ProposedBy = "architect" | "builder" | "user";

export interface StagedChange {
  id: string;
  projectId: string;
  conversationId: string | null;
  filePath: string;
  originalContent: string | null;
  proposedContent: string;
  diff: string;
  status: StagedChangeStatus;
  proposedBy: ProposedBy;
  architectReview: ArchitectReviewStatus;
  architectReviewNote: string | null;
  reviewedBy: string | null;
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Deployments ────────────────────────────────────────────────────────────

export type DeployTarget = "hostsblue" | "export" | "kamatera";
export type DeployStatus = "pending" | "building" | "deployed" | "failed";

export interface Deployment {
  id: string;
  projectId: string;
  userId: string;
  target: DeployTarget;
  status: DeployStatus;
  buildLog: string | null;
  deployedUrl: string | null;
  deployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Project Secrets ────────────────────────────────────────────────────────

export interface ProjectSecret {
  id: string;
  projectId: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Usage ───────────────────────────────────────────────────────────────

export interface AIUsageRecord {
  id: string;
  userId: string;
  projectId: string | null;
  conversationId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: string;
  createdAt: string;
}

// ─── Billing Cycles ─────────────────────────────────────────────────────────

export type BillingCycleStatus = "pending" | "paid" | "failed" | "void";

export interface BillingCycle {
  id: string;
  subscriptionId: string;
  amount: number;
  status: BillingCycleStatus;
  attemptCount: number;
  nextAttemptAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

// ─── IDE ─────────────────────────────────────────────────────────────────────

export type ActivePane = "architect" | "builder" | null;
export type CenterTab = "tools" | "staging" | "files" | "terminal" | "secrets" | "database" | "preview" | "git" | "services" | "thread" | "style-guide";

export interface ComputeStatus {
  sessionsUsed: number;
  sessionsAllowed: number;
  percentage: number;
  level: "normal" | "warning" | "critical" | "depleted";
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
}
