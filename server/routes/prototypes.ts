import { Router } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db.js";
import { prototypes, projects } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// POST /api/prototypes — save a prototype
router.post("/", async (req, res) => {
  try {
    const { projectId, conversationId, htmlContent, technicalSpec, status } = req.body;

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, req.user!.userId))
      );
    if (!project) { res.status(404).json({ message: "Project not found" }); return; }

    // If approving, supersede previous approved prototypes
    if (status === "approved") {
      await db
        .update(prototypes)
        .set({ status: "superseded", updatedAt: new Date() })
        .where(
          and(eq(prototypes.projectId, projectId), eq(prototypes.status, "approved"))
        );
    }

    // Get next version
    const existing = await db
      .select({ maxVersion: sql<number>`COALESCE(MAX(version), 0)` })
      .from(prototypes)
      .where(eq(prototypes.projectId, projectId));

    const nextVersion = (existing[0]?.maxVersion ?? 0) + 1;

    const [proto] = await db
      .insert(prototypes)
      .values({
        projectId,
        conversationId,
        version: nextVersion,
        htmlContent,
        technicalSpec: technicalSpec ?? "",
        status,
        approvedAt: status === "approved" ? new Date() : null,
      })
      .returning();

    res.status(201).json(proto);
  } catch (error) {
    console.error("Create prototype error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/prototypes/:projectId/latest — get latest approved prototype
router.get("/:projectId/latest", async (req, res) => {
  try {
    const [proto] = await db
      .select()
      .from(prototypes)
      .where(
        and(
          eq(prototypes.projectId, req.params.projectId),
          eq(prototypes.status, "approved")
        )
      )
      .orderBy(desc(prototypes.version))
      .limit(1);

    res.json(proto ?? null);
  } catch (error) {
    console.error("Get prototype error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/prototypes/:projectId — get all prototypes for a project
router.get("/:projectId", async (req, res) => {
  try {
    const protos = await db
      .select()
      .from(prototypes)
      .where(eq(prototypes.projectId, req.params.projectId))
      .orderBy(desc(prototypes.version));

    res.json(protos);
  } catch (error) {
    console.error("List prototypes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
