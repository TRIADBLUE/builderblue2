import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { projectFiles, projects } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// ─── Project Memory System ──────────────────────────────────────────────────
// Stores persistent per-project data as special project files under .bb2/

async function getMemoryFile(projectId: string, key: string): Promise<string | null> {
  const path = `.bb2/${key}.json`;
  const [file] = await db
    .select()
    .from(projectFiles)
    .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.path, path)));
  return file?.content ?? null;
}

async function setMemoryFile(projectId: string, key: string, content: string): Promise<void> {
  const path = `.bb2/${key}.json`;
  const [existing] = await db
    .select()
    .from(projectFiles)
    .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.path, path)));

  if (existing) {
    await db
      .update(projectFiles)
      .set({ content, updatedAt: new Date() })
      .where(eq(projectFiles.id, existing.id));
  } else {
    await db.insert(projectFiles).values({
      projectId,
      path,
      content,
      language: "json",
      lastModifiedBy: "system",
    });
  }
}

// ─── Style Guide ────────────────────────────────────────────────────────────

// GET /api/memory/:projectId/style-guide
router.get("/:projectId/style-guide", async (req, res) => {
  try {
    // Verify project access
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, req.params.projectId), eq(projects.userId, req.user!.userId))
      );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const content = await getMemoryFile(req.params.projectId, "style-guide");
    if (content) {
      res.json(JSON.parse(content));
    } else {
      res.json({ fonts: {}, colors: {}, spacing: {}, components: [], notes: "" });
    }
  } catch (error) {
    console.error("Get style guide error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/memory/:projectId/style-guide
router.put("/:projectId/style-guide", async (req, res) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, req.params.projectId), eq(projects.userId, req.user!.userId))
      );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await setMemoryFile(req.params.projectId, "style-guide", JSON.stringify(req.body));
    res.json({ message: "Style guide saved" });
  } catch (error) {
    console.error("Save style guide error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Project Memory (general key-value) ─────────────────────────────────────

// GET /api/memory/:projectId/:key
router.get("/:projectId/:key", async (req, res) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, req.params.projectId), eq(projects.userId, req.user!.userId))
      );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const content = await getMemoryFile(req.params.projectId, req.params.key);
    if (content) {
      try {
        res.json(JSON.parse(content));
      } catch {
        res.json({ value: content });
      }
    } else {
      res.status(404).json({ message: "Memory key not found" });
    }
  } catch (error) {
    console.error("Get memory error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/memory/:projectId/:key
router.put("/:projectId/:key", async (req, res) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, req.params.projectId), eq(projects.userId, req.user!.userId))
      );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const content = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    await setMemoryFile(req.params.projectId, req.params.key, content);
    res.json({ message: "Memory saved" });
  } catch (error) {
    console.error("Save memory error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
