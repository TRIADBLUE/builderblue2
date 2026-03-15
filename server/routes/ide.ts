import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/ide/terminal/:projectId — WebSocket upgrade placeholder
// Terminal implementation requires node-pty + ws which need native compilation.
// The WebSocket upgrade will be handled in server/index.ts when ready.
router.get("/terminal/:projectId", (_req, res) => {
  res.json({
    message: "Terminal WebSocket endpoint. Connect via ws:// protocol.",
    status: "available",
  });
});

// GET /api/ide/preview/:projectId — proxy to running project
router.get("/preview/:projectId", (_req, res) => {
  res.json({
    message: "Preview proxy endpoint",
    status: "available",
  });
});

export default router;
