import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db.js";
import { threadEntries, projects } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/thread/:projectId — list all thread entries for a project
router.get("/:projectId", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(threadEntries)
      .where(eq(threadEntries.projectId, req.params.projectId))
      .orderBy(threadEntries.createdAt);

    res.json(
      entries.map((e) => ({
        id: e.id,
        role: e.role,
        action: e.action,
        content: e.content,
        filePath: e.filePath,
        timestamp: e.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("List thread entries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/thread/:projectId — add a thread entry
router.post("/:projectId", async (req, res) => {
  try {
    const { role, action, content, filePath, conversationId, stagedChangeId } = req.body;

    const [entry] = await db
      .insert(threadEntries)
      .values({
        projectId: req.params.projectId,
        role,
        action,
        content,
        filePath: filePath ?? null,
        conversationId: conversationId ?? null,
        stagedChangeId: stagedChangeId ?? null,
      })
      .returning();

    res.status(201).json({
      id: entry.id,
      role: entry.role,
      action: entry.action,
      content: entry.content,
      filePath: entry.filePath,
      timestamp: entry.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Create thread entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
