import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  conversations,
  projects,
  stagedChanges,
  projectFiles,
} from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  streamCompletion,
  detectCodeBlocks,
  reviewStagedCode,
} from "../services/ai-service.js";
import { generateDiff } from "../services/diff-service.js";
import type { ConversationMessage, AIProvider } from "../../shared/types.js";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  projectId: z.string().uuid(),
  role: z.enum(["architect", "builder"]),
  provider: z.enum(["claude", "deepseek", "gemini", "kimi"]),
  model: z.string().min(1),
});

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

// GET /api/conversations/:projectId — list conversations for project
router.get("/:projectId", async (req, res) => {
  try {
    const convos = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.projectId, req.params.projectId),
          eq(conversations.userId, req.user!.userId)
        )
      );
    res.json(convos);
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/conversations — create new conversation
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

    const [convo] = await db
      .insert(conversations)
      .values({
        projectId: parsed.data.projectId,
        userId: req.user!.userId,
        role: parsed.data.role,
        provider: parsed.data.provider,
        model: parsed.data.model,
        messages: [],
      })
      .returning();

    res.status(201).json(convo);
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/conversations/detail/:id — get conversation with messages
router.get("/detail/:id", async (req, res) => {
  try {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.user!.userId)
        )
      );

    if (!convo) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    res.json(convo);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/conversations/:id/message — send message, stream AI response via SSE
router.post("/:id/message", async (req, res) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.user!.userId)
        )
      );

    if (!convo) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    // Add user message
    const currentMessages = (convo.messages ?? []) as ConversationMessage[];
    const userMessage: ConversationMessage = {
      role: "user",
      content: parsed.data.content,
      timestamp: new Date().toISOString(),
    };
    currentMessages.push(userMessage);

    // Set up SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    let fullResponse = "";

    await streamCompletion(
      convo.provider as AIProvider,
      convo.model,
      currentMessages,
      {
        onChunk: (text) => {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
        },
        onComplete: async (fullText, inputTokens, outputTokens) => {
          // Add assistant message
          const assistantMessage: ConversationMessage = {
            role: "assistant",
            content: fullText,
            timestamp: new Date().toISOString(),
          };
          currentMessages.push(assistantMessage);

          // Update conversation in DB
          await db
            .update(conversations)
            .set({
              messages: currentMessages,
              updatedAt: new Date(),
            })
            .where(eq(conversations.id, convo.id));

          // Detect code blocks and auto-stage (Builder pane only)
          if (convo.role === "builder") {
            const codeBlocks = detectCodeBlocks(fullText);
            const stagedIds: string[] = [];

            for (const block of codeBlocks) {
              // Find existing file content
              const [existingFile] = await db
                .select()
                .from(projectFiles)
                .where(
                  and(
                    eq(projectFiles.projectId, convo.projectId),
                    eq(projectFiles.path, block.filePath)
                  )
                );

              const original = existingFile?.content ?? null;
              const diff = generateDiff(block.filePath, original, block.content);

              const [staged] = await db
                .insert(stagedChanges)
                .values({
                  projectId: convo.projectId,
                  conversationId: convo.id,
                  filePath: block.filePath,
                  originalContent: original,
                  proposedContent: block.content,
                  diff,
                  status: "pending_review",
                  proposedBy: "builder",
                  architectReview: "reviewing",
                })
                .returning();

              stagedIds.push(staged.id);

              // Fire architect review async — don't block the stream
              reviewStagedCode(
                block.filePath,
                original,
                block.content,
                diff,
                { userId: req.user!.userId, projectId: convo.projectId }
              ).then(async (result) => {
                await db
                  .update(stagedChanges)
                  .set({
                    architectReview: result.approved ? "approved" : "rejected",
                    architectReviewNote: result.note,
                    status: result.approved ? "pending" : "rejected",
                    updatedAt: new Date(),
                  })
                  .where(eq(stagedChanges.id, staged.id));
              }).catch((err) => {
                console.error("Architect review failed:", err);
                // Auto-approve on failure
                db.update(stagedChanges)
                  .set({
                    architectReview: "approved",
                    architectReviewNote: "Auto-approved (review error)",
                    status: "pending",
                    updatedAt: new Date(),
                  })
                  .where(eq(stagedChanges.id, staged.id));
              });
            }

            if (stagedIds.length > 0) {
              res.write(
                `data: ${JSON.stringify({ type: "staged", ids: stagedIds })}\n\n`
              );
            }
          }

          res.write(
            `data: ${JSON.stringify({
              type: "done",
              inputTokens,
              outputTokens,
            })}\n\n`
          );
          res.end();
        },
        onError: (error) => {
          res.write(
            `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
          );
          res.end();
        },
      },
      {
        userId: req.user!.userId,
        projectId: convo.projectId,
        conversationId: convo.id,
      }
    );
  } catch (error) {
    console.error("Message error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    } else {
      res.end();
    }
  }
});

export default router;
