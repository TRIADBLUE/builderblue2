import { Router } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db.js";
import { projectTodos } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/todos/:projectId — list all todos for a project
router.get("/:projectId", async (req, res) => {
  try {
    const todos = await db
      .select()
      .from(projectTodos)
      .where(eq(projectTodos.projectId, req.params.projectId))
      .orderBy(asc(projectTodos.priority), asc(projectTodos.createdAt));

    res.json(todos);
  } catch (error) {
    console.error("List todos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/todos/:projectId — create a todo
router.post("/:projectId", async (req, res) => {
  try {
    const { content, priority, source } = req.body;

    const [todo] = await db
      .insert(projectTodos)
      .values({
        projectId: req.params.projectId,
        content,
        priority: priority ?? 0,
        source: source ?? "user",
      })
      .returning();

    res.status(201).json(todo);
  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/todos/:projectId/:id — update a todo
router.patch("/:projectId/:id", async (req, res) => {
  try {
    const { content, status, priority } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;

    const [updated] = await db
      .update(projectTodos)
      .set(updates)
      .where(
        and(
          eq(projectTodos.id, req.params.id),
          eq(projectTodos.projectId, req.params.projectId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/todos/:projectId/:id — delete a todo
router.delete("/:projectId/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(projectTodos)
      .where(
        and(
          eq(projectTodos.id, req.params.id),
          eq(projectTodos.projectId, req.params.projectId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.json({ message: "Todo deleted" });
  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
