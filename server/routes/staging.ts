import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  stagedChanges,
  projects,
  projectFiles,
} from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";
import { generateDiff } from "../services/diff-service.js";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().nullable().optional(),
  filePath: z.string().min(1),
  proposedContent: z.string(),
  proposedBy: z.enum(["architect", "builder", "user"]),
});

const updateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

// GET /api/staging/:projectId — list staged changes
router.get("/:projectId", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;

    let query = db
      .select()
      .from(stagedChanges)
      .where(eq(stagedChanges.projectId, req.params.projectId));

    const results = await query;

    // Filter by status in JS since Drizzle chaining is limited
    const filtered = status
      ? results.filter((r) => r.status === status)
      : results;

    res.json(filtered);
  } catch (error) {
    console.error("List staged changes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/staging — create staged change
router.post("/", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, parsed.data.projectId),
          eq(projects.userId, req.user!.userId)
        )
      );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Find existing file for diff
    const [existingFile] = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, parsed.data.projectId),
          eq(projectFiles.path, parsed.data.filePath)
        )
      );

    const original = existingFile?.content ?? null;
    const diff = generateDiff(
      parsed.data.filePath,
      original,
      parsed.data.proposedContent
    );

    const [staged] = await db
      .insert(stagedChanges)
      .values({
        projectId: parsed.data.projectId,
        conversationId: parsed.data.conversationId ?? null,
        filePath: parsed.data.filePath,
        originalContent: original,
        proposedContent: parsed.data.proposedContent,
        diff,
        status: "pending",
        proposedBy: parsed.data.proposedBy,
      })
      .returning();

    res.status(201).json(staged);
  } catch (error) {
    console.error("Create staged change error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/staging/:id — approve or reject
router.patch("/:id", async (req, res) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const [updated] = await db
      .update(stagedChanges)
      .set({
        status: parsed.data.status,
        reviewedBy: req.user!.userId,
        updatedAt: new Date(),
      })
      .where(eq(stagedChanges.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Staged change not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Update staged change error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/staging/:projectId/commit — commit all approved changes
router.post("/:projectId/commit", async (req, res) => {
  try {
    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, req.params.projectId),
          eq(projects.userId, req.user!.userId)
        )
      );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Get all approved changes
    const approved = await db
      .select()
      .from(stagedChanges)
      .where(
        and(
          eq(stagedChanges.projectId, req.params.projectId),
          eq(stagedChanges.status, "approved")
        )
      );

    if (approved.length === 0) {
      res.status(400).json({ message: "No approved changes to commit" });
      return;
    }

    const committedFiles: string[] = [];

    for (const change of approved) {
      // Upsert file content
      const [existingFile] = await db
        .select()
        .from(projectFiles)
        .where(
          and(
            eq(projectFiles.projectId, req.params.projectId),
            eq(projectFiles.path, change.filePath)
          )
        );

      const language = inferLanguage(change.filePath);

      if (existingFile) {
        await db
          .update(projectFiles)
          .set({
            content: change.proposedContent,
            lastModifiedBy: change.proposedBy,
            updatedAt: new Date(),
          })
          .where(eq(projectFiles.id, existingFile.id));
      } else {
        await db.insert(projectFiles).values({
          projectId: req.params.projectId,
          path: change.filePath,
          content: change.proposedContent,
          language,
          lastModifiedBy: change.proposedBy,
        });
      }

      // Mark as committed
      await db
        .update(stagedChanges)
        .set({
          status: "committed",
          committedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stagedChanges.id, change.id));

      committedFiles.push(change.filePath);
    }

    res.json({
      message: `Committed ${committedFiles.length} file(s)`,
      files: committedFiles,
    });
  } catch (error) {
    console.error("Commit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    rs: "rust",
    go: "go",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sh: "shell",
    bash: "shell",
  };
  return langMap[ext] ?? "text";
}

export default router;
