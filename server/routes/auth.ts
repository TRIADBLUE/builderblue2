import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  invalidateRefreshToken,
  rotateRefreshToken,
  createMagicLink,
  verifyMagicLink,
  findOrCreateUserByEmail,
} from "../services/auth-service.js";
import { verifyRefreshToken } from "../services/jwt-service.js";
import { sendWelcomeEmail, sendMagicLinkEmail } from "../services/email-service.js";
import type { SsoPayload } from "../../shared/types.js";

const router = Router();

const REFRESH_COOKIE = "bb2_refresh";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

// ─── Validation Schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ssoSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { email, password, name } = parsed.data;

    const result = await registerUser(email, password, name);

    // Send welcome email (fire and forget)
    sendWelcomeEmail(email, name);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    if (!result) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await invalidateRefreshToken(payload.tokenId);
      } catch {
        // Token invalid — still clear cookie
      }
    }

    res.clearCookie(REFRESH_COOKIE, { path: "/" });
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/refresh ─────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.clearCookie(REFRESH_COOKIE, { path: "/" });
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const result = await rotateRefreshToken(payload.tokenId, token);
    if (!result) {
      res.clearCookie(REFRESH_COOKIE, { path: "/" });
      res.status(401).json({ message: "Refresh token expired or already used" });
      return;
    }

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/magic-link/request ──────────────────────────────────────

router.post("/magic-link/request", async (req, res) => {
  try {
    const parsed = magicLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { email } = parsed.data;

    // Always return 200 to prevent email enumeration
    const rawToken = await createMagicLink(email);
    if (rawToken) {
      sendMagicLinkEmail(email, rawToken);
    }

    res.json({ message: "If an account exists, a login link has been sent" });
  } catch (error) {
    console.error("Magic link request error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/auth/magic-link/verify ────────────────────────────────────────

router.get("/magic-link/verify", async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    const result = await verifyMagicLink(token);
    if (!result) {
      res.status(401).json({ message: "Invalid or expired magic link" });
      return;
    }

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    // Redirect to dashboard — the frontend will pick up auth from the cookie
    res.redirect(`/dashboard?token=${encodeURIComponent(result.accessToken)}`);
  } catch (error) {
    console.error("Magic link verify error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/sso/hostsblue ───────────────────────────────────────────

router.post("/sso/hostsblue", async (req, res) => {
  try {
    const parsed = ssoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { token } = parsed.data;
    const secret = process.env.HOSTSBLUE_SSO_SECRET;
    if (!secret) {
      res.status(500).json({ message: "SSO not configured" });
      return;
    }

    // Token format: base64(JSON payload).base64(HMAC-SHA256 signature)
    const parts = token.split(".");
    if (parts.length !== 2) {
      res.status(401).json({ message: "Invalid SSO token format" });
      return;
    }

    const [payloadB64, signatureB64] = parts;

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    if (signatureB64 !== expectedSignature) {
      res.status(401).json({ message: "Invalid SSO token signature" });
      return;
    }

    // Decode payload
    const payload: SsoPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );

    // Check expiry (5-minute window)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      res.status(401).json({ message: "SSO token expired" });
      return;
    }
    if (payload.iat && now - payload.iat > 300) {
      res.status(401).json({ message: "SSO token too old" });
      return;
    }

    if (!payload.email) {
      res.status(400).json({ message: "SSO token missing email" });
      return;
    }

    const result = await findOrCreateUserByEmail(payload.email, payload.name);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("SSO error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
