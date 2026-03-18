import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { spawn } from "child_process";
import type { ChildProcessWithoutNullStreams } from "child_process";
import authRoutes from "./routes/auth.js";
import billingRoutes from "./routes/billing.js";
import projectRoutes from "./routes/projects.js";
import conversationRoutes from "./routes/conversations.js";
import stagingRoutes from "./routes/staging.js";
import ideRoutes from "./routes/ide.js";
import collaboratorRoutes from "./routes/collaborators.js";
import folderRoutes from "./routes/folders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/staging", stagingRoutes);
app.use("/api/ide", ideRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/folders", folderRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Static / SPA ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── HTTP + WebSocket Server ─────────────────────────────────────────────────

const server = createServer(app);

// Terminal WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Track active terminal sessions
const terminalSessions = new Map<
  string,
  { shell: ChildProcessWithoutNullStreams; ws: WebSocket }
>();

wss.on("connection", (ws: WebSocket, projectId: string) => {
  console.log(`Terminal WebSocket connected: project ${projectId}`);

  // Spawn a bash shell
  const shell = spawn("bash", ["--login"], {
    cwd: process.env.HOME || "/tmp",
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    },
  });

  const sessionKey = `${projectId}-${Date.now()}`;
  terminalSessions.set(sessionKey, { shell, ws });

  // Send shell output to WebSocket
  shell.stdout.on("data", (data: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data.toString());
    }
  });

  shell.stderr.on("data", (data: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data.toString());
    }
  });

  shell.on("close", (code: number | null) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(`\r\n[Process exited with code ${code}]\r\n`);
      ws.close();
    }
    terminalSessions.delete(sessionKey);
  });

  // Receive input from WebSocket
  ws.on("message", (data: Buffer | string) => {
    const input = data.toString();
    if (shell.stdin.writable) {
      shell.stdin.write(input);
    }
  });

  ws.on("close", () => {
    console.log(`Terminal WebSocket disconnected: project ${projectId}`);
    shell.kill();
    terminalSessions.delete(sessionKey);
  });

  // Send welcome message
  ws.send("BuilderBlue\u00B2 Terminal \u2014 Connected\r\n");
});

// Handle WebSocket upgrade
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const match = url.pathname.match(/^\/api\/ide\/terminal\/(.+)$/);

  if (match) {
    const projectId = match[1];
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, projectId);
    });
  } else {
    socket.destroy();
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BuilderBlue\u00B2 server running on port ${PORT}`);
});

export default app;
