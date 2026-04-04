import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "../db.js";
import {
  subscriptions,
  computeUsage,
  computeBlocks,
  aiUsage,
  conversations,
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

// GET /api/billing/project-usage/:projectId — line-item compute costs for a project
router.get("/project-usage/:projectId", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const projectId = req.params.projectId;

    const items = await db
      .select({
        id: aiUsage.id,
        provider: aiUsage.provider,
        model: aiUsage.model,
        inputTokens: aiUsage.inputTokens,
        outputTokens: aiUsage.outputTokens,
        costUsd: aiUsage.costUsd,
        conversationId: aiUsage.conversationId,
        createdAt: aiUsage.createdAt,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.userId, userId),
          eq(aiUsage.projectId, projectId)
        )
      )
      .orderBy(desc(aiUsage.createdAt))
      .limit(100);

    const enriched = [];
    for (const item of items) {
      let role = "unknown";
      if (item.conversationId) {
        const [convo] = await db
          .select({ role: conversations.role })
          .from(conversations)
          .where(eq(conversations.id, item.conversationId));
        role = convo?.role ?? "unknown";
      }
      enriched.push({
        ...item,
        role,
        costUsd: item.costUsd.toString(),
      });
    }

    const totalCost = enriched.reduce((sum, item) => sum + parseFloat(item.costUsd), 0);

    res.json({
      items: enriched,
      totalCost: totalCost.toFixed(4),
      itemCount: enriched.length,
    });
  } catch (error) {
    console.error("Project usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
