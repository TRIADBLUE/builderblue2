import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  projectCollaborators,
  projects,
  users,
} from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const inviteSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

// GET /api/collaborators/:projectId — list collaborators for a project
router.get("/:projectId", async (req, res) => {
  try {
    // Verify project ownership or membership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.projectId));

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const collabs = await db
      .select({
        id: projectCollaborators.id,
        role: projectCollaborators.role,
        status: projectCollaborators.status,
        invitedEmail: projectCollaborators.invitedEmail,
        createdAt: projectCollaborators.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(projectCollaborators)
      .leftJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, req.params.projectId));

    res.json(collabs);
  } catch (error) {
    console.error("List collaborators error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/collaborators — invite a collaborator
router.post("/", async (req, res) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
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
      res.status(404).json({ message: "Project not found or not owned by you" });
      return;
    }

    // Check if user already invited
    const existing = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, parsed.data.projectId),
          eq(projectCollaborators.invitedEmail, parsed.data.email)
        )
      );

    if (existing.length > 0) {
      res.status(409).json({ message: "User already invited" });
      return;
    }

    // Check if invited user exists
    const [invitedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email));

    const [collab] = await db
      .insert(projectCollaborators)
      .values({
        projectId: parsed.data.projectId,
        userId: invitedUser?.id ?? null,
        invitedEmail: parsed.data.email,
        role: parsed.data.role,
        invitedBy: req.user!.userId,
        status: invitedUser ? "active" : "pending",
      })
      .returning();

    res.status(201).json(collab);
  } catch (error) {
    console.error("Invite collaborator error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/collaborators/:id — update role
router.patch("/:id", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["editor", "viewer"].includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const [updated] = await db
      .update(projectCollaborators)
      .set({ role, updatedAt: new Date() })
      .where(eq(projectCollaborators.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Collaborator not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Update collaborator error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/collaborators/:id — remove collaborator
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(projectCollaborators)
      .where(eq(projectCollaborators.id, req.params.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Collaborator not found" });
      return;
    }

    res.json({ message: "Collaborator removed" });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
