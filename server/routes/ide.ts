import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { projectFiles } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";
import { spawn } from "child_process";
import type { ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const router = Router();
router.use(authenticate);

// ─── Preview Project Runner ──────────────────────────────────────────────────

// Track running preview processes per project
const previewProcesses = new Map<
  string,
  { process: ChildProcessWithoutNullStreams; port: number; dir: string; lastAccess: number }
>();

// Base port for preview servers (each project gets its own)
let nextPort = 4100;

async function getOrStartPreview(projectId: string): Promise<{ port: number; status: string }> {
  // Check if already running
  const existing = previewProcesses.get(projectId);
  if (existing) {
    existing.lastAccess = Date.now();
    return { port: existing.port, status: "running" };
  }

  // Get project files from database
  const files = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId));

  if (files.length === 0) {
    return { port: 0, status: "no_files" };
  }

  // Write project files to a temp directory
  const tmpDir = path.join(os.tmpdir(), `bb2-preview-${projectId.slice(0, 8)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(tmpDir, file.path);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, file.content, "utf-8");
  }

  // Check if it's a Node/React project (has package.json)
  const hasPackageJson = files.some((f) => f.path === "package.json");
  const hasIndexHtml = files.some(
    (f) => f.path === "index.html" || f.path === "public/index.html"
  );

  const port = nextPort++;

  if (hasPackageJson) {
    // Install deps and start dev server
    try {
      // Run npm install first
      const install = spawn("npm", ["install", "--no-audit", "--no-fund"], {
        cwd: tmpDir,
        env: { ...process.env, PORT: String(port) },
      });

      await new Promise<void>((resolve, reject) => {
        install.on("close", (code) =>
          code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`))
        );
        install.on("error", reject);
        // Timeout after 60s
        setTimeout(() => reject(new Error("npm install timeout")), 60000);
      });

      // Start the dev server
      const devProcess = spawn("npm", ["run", "dev"], {
        cwd: tmpDir,
        env: { ...process.env, PORT: String(port) },
      });

      previewProcesses.set(projectId, {
        process: devProcess,
        port,
        dir: tmpDir,
        lastAccess: Date.now(),
      });

      devProcess.on("close", () => {
        previewProcesses.delete(projectId);
      });

      // Wait for server to start
      await new Promise((r) => setTimeout(r, 3000));

      return { port, status: "running" };
    } catch (error) {
      console.error("Preview start error:", error);
      return { port: 0, status: "error" };
    }
  } else if (hasIndexHtml) {
    // Simple static file server using a basic HTTP server
    const http = await import("http");
    const staticServer = http.createServer((req, res) => {
      let reqPath = req.url || "/";
      if (reqPath === "/") reqPath = "/index.html";

      const filePath = path.join(tmpDir, reqPath);
      if (!filePath.startsWith(tmpDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml",
        };
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    staticServer.listen(port);

    // Store as a pseudo-process
    previewProcesses.set(projectId, {
      process: staticServer as any,
      port,
      dir: tmpDir,
      lastAccess: Date.now(),
    });

    return { port, status: "running" };
  }

  return { port: 0, status: "unsupported" };
}

// Cleanup idle previews every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, preview] of previewProcesses.entries()) {
    if (now - preview.lastAccess > 10 * 60 * 1000) {
      // 10 min idle
      console.log(`Cleaning up idle preview: ${id}`);
      try {
        preview.process.kill();
      } catch {}
      try {
        fs.rmSync(preview.dir, { recursive: true, force: true });
      } catch {}
      previewProcesses.delete(id);
    }
  }
}, 5 * 60 * 1000);

// GET /api/ide/terminal/:projectId — WebSocket upgrade info
router.get("/terminal/:projectId", (_req, res) => {
  res.json({
    message: "Terminal WebSocket endpoint. Connect via ws:// protocol.",
    status: "available",
  });
});

// GET /api/ide/preview/:projectId — start or proxy to running preview
router.get("/preview/:projectId", async (req, res) => {
  try {
    const { port, status } = await getOrStartPreview(req.params.projectId);

    if (status === "no_files") {
      res.status(200).send(`
        <html>
          <body style="background:#1a1a1a;color:#e9ecf0;font-family:Source Code Pro,monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center;opacity:0.5">
              <p style="font-size:18px">No project files yet</p>
              <p style="font-size:13px">Ask the Builder to create some code, then refresh the preview.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    if (status === "error" || status === "unsupported") {
      res.status(200).send(`
        <html>
          <body style="background:#1a1a1a;color:#e9ecf0;font-family:Source Code Pro,monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center;opacity:0.5">
              <p style="font-size:18px">Preview unavailable</p>
              <p style="font-size:13px">Could not start a preview server for this project type.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // Proxy to the running preview server
    try {
      const proxyRes = await fetch(`http://localhost:${port}${req.url?.replace(/^\/api\/ide\/preview\/[^/]+/, "") || "/"}`);
      const body = await proxyRes.text();

      res.writeHead(proxyRes.status, {
        "Content-Type": proxyRes.headers.get("content-type") || "text/html",
      });
      res.end(body);
    } catch {
      // Proxy failed — server might still be starting
      res.status(200).send(`
        <html>
          <body style="background:#1a1a1a;color:#e9ecf0;font-family:Source Code Pro,monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <div class="spinner" style="width:24px;height:24px;border:2px solid rgba(233,236,240,0.2);border-top:2px solid #4A90D9;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div>
              <p style="opacity:0.6;font-size:14px">Starting preview server...</p>
              <script>setTimeout(() => location.reload(), 3000);</script>
              <style>@keyframes spin { to { transform: rotate(360deg) } }</style>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ message: "Preview error" });
  }
});

// POST /api/ide/preview/:projectId/refresh — rebuild preview files
router.post("/preview/:projectId/refresh", async (req, res) => {
  try {
    const existing = previewProcesses.get(req.params.projectId);
    if (existing) {
      try {
        existing.process.kill();
      } catch {}
      try {
        fs.rmSync(existing.dir, { recursive: true, force: true });
      } catch {}
      previewProcesses.delete(req.params.projectId);
    }

    const result = await getOrStartPreview(req.params.projectId);
    res.json(result);
  } catch (error) {
    console.error("Preview refresh error:", error);
    res.status(500).json({ message: "Preview refresh error" });
  }
});

// DELETE /api/ide/preview/:projectId — stop preview
router.delete("/preview/:projectId", (req, res) => {
  const existing = previewProcesses.get(req.params.projectId);
  if (existing) {
    try {
      existing.process.kill();
    } catch {}
    try {
      fs.rmSync(existing.dir, { recursive: true, force: true });
    } catch {}
    previewProcesses.delete(req.params.projectId);
  }
  res.json({ status: "stopped" });
});

export default router;
