import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { users, refreshTokens, magicLinks } from "../../shared/schema.js";
import {
  signAccessToken,
  signRefreshToken,
} from "./jwt-service.js";
import type { PublicUser, AuthResponse } from "../../shared/types.js";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as PublicUser["role"],
  };
}

async function activateOwnerIfMatch(
  userId: string,
  email: string,
  currentRole: string
): Promise<string> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase() && currentRole !== "owner") {
    await db
      .update(users)
      .set({ role: "owner", updatedAt: new Date() })
      .where(eq(users.id, userId));
    return "owner";
  }
  return currentRole;
}

async function issueTokens(
  user: PublicUser
): Promise<{ accessToken: string; refreshToken: string; refreshTokenId: string }> {
  const accessToken = signAccessToken(user);

  const refreshTokenId = crypto.randomUUID();
  const rawRefreshToken = signRefreshToken(user.id, refreshTokenId);
  const tokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_ROUNDS);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await db.insert(refreshTokens).values({
    id: refreshTokenId,
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken: rawRefreshToken, refreshTokenId };
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse & { refreshToken: string }> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [newUser] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, name, role: "builder" })
    .returning();

  const role = await activateOwnerIfMatch(newUser.id, newUser.email, newUser.role);
  const publicUser = toPublicUser({ ...newUser, role });

  const { accessToken, refreshToken } = await issueTokens(publicUser);

  return { user: publicUser, accessToken, refreshToken };
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<(AuthResponse & { refreshToken: string }) | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user || !user.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const role = await activateOwnerIfMatch(user.id, user.email, user.role);
  const publicUser = toPublicUser({ ...user, role });

  const { accessToken, refreshToken } = await issueTokens(publicUser);

  return { user: publicUser, accessToken, refreshToken };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function invalidateRefreshToken(tokenId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ usedAt: new Date() })
    .where(eq(refreshTokens.id, tokenId));
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

export async function rotateRefreshToken(
  tokenId: string,
  rawToken: string
): Promise<(AuthResponse & { refreshToken: string }) | null> {
  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.id, tokenId));

  if (!storedToken) return null;
  if (storedToken.usedAt) return null;
  if (storedToken.expiresAt < new Date()) return null;

  const valid = await bcrypt.compare(rawToken, storedToken.tokenHash);
  if (!valid) return null;

  // Mark old token as used
  await db
    .update(refreshTokens)
    .set({ usedAt: new Date() })
    .where(eq(refreshTokens.id, tokenId));

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, storedToken.userId));

  if (!user) return null;

  const publicUser = toPublicUser(user);
  const { accessToken, refreshToken } = await issueTokens(publicUser);

  return { user: publicUser, accessToken, refreshToken };
}

// ─── Magic Link ──────────────────────────────────────────────────────────────

export async function createMagicLink(email: string): Promise<string | null> {
  // Check if user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_MINUTES);

  await db.insert(magicLinks).values({
    email: email.toLowerCase(),
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export async function verifyMagicLink(
  rawToken: string
): Promise<(AuthResponse & { refreshToken: string }) | null> {
  // Get all unused, non-expired magic links
  const allLinks = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.usedAt, null!));

  // Find the matching link by comparing hashes
  let matchedLink: (typeof allLinks)[number] | null = null;
  for (const link of allLinks) {
    if (link.expiresAt < new Date()) continue;
    const valid = await bcrypt.compare(rawToken, link.tokenHash);
    if (valid) {
      matchedLink = link;
      break;
    }
  }

  if (!matchedLink) return null;

  // Mark as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, matchedLink.id));

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, matchedLink.email));

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: matchedLink.email,
        name: matchedLink.email.split("@")[0],
        role: "builder",
      })
      .returning();
  }

  const role = await activateOwnerIfMatch(user.id, user.email, user.role);
  const publicUser = toPublicUser({ ...user, role });

  const { accessToken, refreshToken } = await issueTokens(publicUser);

  return { user: publicUser, accessToken, refreshToken };
}

// ─── SSO ─────────────────────────────────────────────────────────────────────

export async function findOrCreateUserByEmail(
  email: string,
  name?: string
): Promise<AuthResponse & { refreshToken: string }> {
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        role: "builder",
      })
      .returning();
  }

  const role = await activateOwnerIfMatch(user.id, user.email, user.role);
  const publicUser = toPublicUser({ ...user, role });

  const { accessToken, refreshToken } = await issueTokens(publicUser);

  return { user: publicUser, accessToken, refreshToken };
}
