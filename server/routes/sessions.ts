import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db.js";
import { sessionSummaries, conversations } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/sessions/:projectId — get all session summaries for a project
router.get("/:projectId", async (req, res) => {
  try {
    const summaries = await db
      .select()
      .from(sessionSummaries)
      .where(eq(sessionSummaries.projectId, req.params.projectId))
      .orderBy(desc(sessionSummaries.createdAt));

    res.json(summaries);
  } catch (error) {
    console.error("List sessions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/sessions/:projectId/context — get AI context payload
// This is what the AI reads at the start of each session to pick up where it left off
router.get("/:projectId/context", async (req, res) => {
  try {
    // Get the 3 most recent session summaries
    const summaries = await db
      .select()
      .from(sessionSummaries)
      .where(eq(sessionSummaries.projectId, req.params.projectId))
      .orderBy(desc(sessionSummaries.createdAt))
      .limit(3);

    // Get project memory (style guide, notes, decisions)
    const { projectMemory } = await import("../../shared/schema.js");
    const memory = await db
      .select()
      .from(projectMemory)
      .where(eq(projectMemory.projectId, req.params.projectId));

    const memoryMap: Record<string, any> = {};
    for (const m of memory) {
      memoryMap[m.key] = m.value;
    }

    // Get project todos
    const { projectTodos } = await import("../../shared/schema.js");
    const todos = await db
      .select()
      .from(projectTodos)
      .where(eq(projectTodos.projectId, req.params.projectId));

    const openTodos = todos.filter((t) => t.status !== "done");

    res.json({
      recentSessions: summaries.map((s) => ({
        role: s.role,
        summary: s.summary,
        keyDecisions: s.keyDecisions,
        openItems: s.openItems,
        filesModified: s.filesModified,
        messageCount: s.messageCount,
        date: s.createdAt.toISOString(),
      })),
      memory: memoryMap,
      openTodos: openTodos.map((t) => ({
        content: t.content,
        status: t.status,
        source: t.source,
        priority: t.priority,
      })),
    });
  } catch (error) {
    console.error("Get session context error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/sessions/:projectId — create a session summary (auto-generated)
router.post("/:projectId", async (req, res) => {
  try {
    const { conversationId, role, summary, keyDecisions, openItems, filesModified, messageCount } = req.body;

    const [created] = await db
      .insert(sessionSummaries)
      .values({
        projectId: req.params.projectId,
        conversationId: conversationId ?? null,
        role,
        summary,
        keyDecisions: keyDecisions ?? [],
        openItems: openItems ?? [],
        filesModified: filesModified ?? [],
        messageCount: messageCount ?? 0,
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Create session summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
