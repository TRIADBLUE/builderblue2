import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { projects, projectFiles } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

// GET /api/projects — list user's projects
router.get("/", async (req, res) => {
  try {
    const userProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, req.user!.userId),
          eq(projects.status, "active")
        )
      );
    res.json(userProjects);
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/projects — create project
router.post("/", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: req.user!.userId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning();

    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/projects/:id — get project with files
router.get("/:id", async (req, res) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, req.params.id),
          eq(projects.userId, req.user!.userId)
        )
      );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, project.id));

    res.json({ ...project, files });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/projects/:id — update project
router.patch("/:id", async (req, res) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const [updated] = await db
      .update(projects)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, req.params.id),
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
    console.error("Update project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/projects/:id — archive project
router.delete("/:id", async (req, res) => {
  try {
    const [updated] = await db
      .update(projects)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, req.params.id),
          eq(projects.userId, req.user!.userId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json({ message: "Project archived" });
  } catch (error) {
    console.error("Archive project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
