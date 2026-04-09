import { Router } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db.js";
import { deployments, projects, projectFiles } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";
import { deployToHostsblue, buildProjectZip } from "../services/hostsblue-deploy.js";

const router = Router();
router.use(authenticate);

const deploySchema = z.object({
  target: z.enum(["hostsblue", "export"]),
  planSlug: z.string().optional(),
});

// POST /api/deploy/:projectId — initiate deployment
router.post("/:projectId", async (req, res) => {
  try {
    const parsed = deploySchema.safeParse(req.body);
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
          eq(projects.id, req.params.projectId),
          eq(projects.userId, req.user!.userId)
        )
      );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Get all project files
    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, project.id));

    if (files.length === 0) {
      res.status(400).json({ message: "No files to deploy" });
      return;
    }

    if (parsed.data.target === "export") {
      const zipBuffer = await buildProjectZip(
        files.map((f) => ({ path: f.path, content: f.content }))
      );
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip"`
      );
      res.send(zipBuffer);
      return;
    }

    // hostsblue deployment
    if (!parsed.data.planSlug) {
      res.status(400).json({ message: "Plan is required for hostsblue deployment" });
      return;
    }

    // Create deployment record
    const [deployment] = await db
      .insert(deployments)
      .values({
        projectId: project.id,
        userId: req.user!.userId,
        target: parsed.data.target,
        status: "pending",
      })
      .returning();

    // Kick off async deployment
    deployToHostsblue(deployment.id, project, files, parsed.data.planSlug)
      .catch((err) => {
        console.error("Deploy to hostsblue failed:", err);
        db.update(deployments)
          .set({
            status: "failed",
            buildLog: err.message,
            updatedAt: new Date(),
          })
          .where(eq(deployments.id, deployment.id));
      });

    res.status(202).json({
      deploymentId: deployment.id,
      status: "pending",
      message: "Deployment started",
    });
  } catch (error) {
    console.error("Deploy error:", error);
    res.status(500).json({ message: "Deployment failed" });
  }
});

// GET /api/deploy/:projectId/status — latest deployment status
router.get("/:projectId/status", async (req, res) => {
  try {
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.projectId, req.params.projectId),
          eq(deployments.userId, req.user!.userId)
        )
      )
      .orderBy(desc(deployments.createdAt))
      .limit(1);

    if (!deployment) {
      res.json({ status: "none" });
      return;
    }

    res.json({
      id: deployment.id,
      status: deployment.status,
      deployedUrl: deployment.deployedUrl,
      deployedAt: deployment.deployedAt,
      buildLog: deployment.buildLog,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/deploy/:projectId/history — all deployments for project
router.get("/:projectId/history", async (req, res) => {
  try {
    const history = await db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.projectId, req.params.projectId),
          eq(deployments.userId, req.user!.userId)
        )
      )
      .orderBy(desc(deployments.createdAt))
      .limit(20);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
