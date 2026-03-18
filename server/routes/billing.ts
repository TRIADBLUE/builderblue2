import { Router } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../db.js";
import {
  subscriptions,
  computeUsage,
  computeBlocks,
} from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/billing/usage — current compute usage summary
router.get("/usage", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    // Get active subscription
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      );

    // Get current period usage
    const usage = sub
      ? await db
          .select()
          .from(computeUsage)
          .where(
            and(
              eq(computeUsage.userId, userId),
              eq(computeUsage.subscriptionId, sub.id),
              lte(computeUsage.periodStart, now),
              gte(computeUsage.periodEnd, now)
            )
          )
      : [];

    const currentUsage = usage[0];

    // Get total purchased blocks
    const blocks = await db
      .select()
      .from(computeBlocks)
      .where(eq(computeBlocks.userId, userId));

    const totalBlockSessions = blocks.reduce(
      (sum, b) => sum + b.sessionsAdded,
      0
    );

    const sessionsUsed = currentUsage?.sessionsUsed ?? 0;
    const sessionsFromPlan = currentUsage?.sessionsAllowed ?? 0;
    const sessionsTotal = sessionsFromPlan + totalBlockSessions;

    res.json({
      plan: sub?.planId ?? "free",
      planStatus: sub?.status ?? "none",
      sessionsUsed,
      sessionsFromPlan,
      sessionsFromBlocks: totalBlockSessions,
      sessionsTotal,
      sessionsRemaining: Math.max(0, sessionsTotal - sessionsUsed),
      periodStart: currentUsage?.periodStart ?? null,
      periodEnd: currentUsage?.periodEnd ?? null,
      consecutiveBlockMonths: currentUsage?.consecutiveBlockMonths ?? 0,
    });
  } catch (error) {
    console.error("Get usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
