// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "builder";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
}
