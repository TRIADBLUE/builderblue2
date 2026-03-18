import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { projectFolders, projects } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  color: z.string().optional(),
});

// GET /api/folders — list user's folders
router.get("/", async (req, res) => {
  try {
    const folders = await db
      .select()
      .from(projectFolders)
      .where(eq(projectFolders.userId, req.user!.userId));

    res.json(folders);
  } catch (error) {
    console.error("List folders error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/folders — create folder
router.post("/", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const [folder] = await db
      .insert(projectFolders)
      .values({
        userId: req.user!.userId,
        name: parsed.data.name,
        color: parsed.data.color ?? "#4A90D9",
      })
      .returning();

    res.status(201).json(folder);
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/folders/:id — rename folder
router.patch("/:id", async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (color) updates.color = color;

    const [updated] = await db
      .update(projectFolders)
      .set(updates)
      .where(
        and(
          eq(projectFolders.id, req.params.id),
          eq(projectFolders.userId, req.user!.userId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Update folder error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/folders/:id — delete folder (unlinks projects, doesn't delete them)
router.delete("/:id", async (req, res) => {
  try {
    // Unlink all projects from this folder
    await db
      .update(projects)
      .set({ folderId: null, updatedAt: new Date() })
      .where(eq(projects.folderId, req.params.id));

    const [deleted] = await db
      .delete(projectFolders)
      .where(
        and(
          eq(projectFolders.id, req.params.id),
          eq(projectFolders.userId, req.user!.userId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }

    res.json({ message: "Folder deleted" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/folders/:id/move — move a project into this folder
router.post("/:id/move", async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      res.status(400).json({ message: "projectId is required" });
      return;
    }

    const [updated] = await db
      .update(projects)
      .set({ folderId: req.params.id, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, req.user!.userId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Move project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
