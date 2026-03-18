import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { db } from "../db.js";
import { projects, projectFiles } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// ─── Helpers ────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", "__pycache__"]);
const BINARY_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".mp3", ".mp4", ".zip", ".tar", ".gz", ".pdf"]);

function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    css: "css", html: "html", json: "json", md: "markdown", py: "python",
    rs: "rust", go: "go", sql: "sql", yaml: "yaml", yml: "yaml",
    toml: "toml", sh: "shell", bash: "shell", vue: "vue", svelte: "svelte",
  };
  return langMap[ext] ?? "text";
}

function readDirRecursive(dir: string, base: string = ""): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...readDirRecursive(fullPath, relPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;
      const stat = fs.statSync(fullPath);
      if (stat.size > 500_000) continue; // skip files > 500KB
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        results.push({ path: relPath, content });
      } catch { /* skip unreadable */ }
    }
  }
  return results;
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(["private", "public"]).optional(),
  customDomain: z.string().nullable().optional(),
  subdomain: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/).nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
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

// ─── Import from GitHub ─────────────────────────────────────────────────────

const importGithubSchema = z.object({
  repoUrl: z.string().url().refine(
    (url) => /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/.test(url),
    "Must be a valid GitHub repository URL"
  ),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

router.post("/import/github", async (req, res) => {
  try {
    const parsed = importGithubSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { repoUrl } = parsed.data;
    // Extract repo name from URL
    const urlParts = repoUrl.replace(/\.git$/, "").split("/");
    const repoName = urlParts[urlParts.length - 1];
    const projectName = parsed.data.name || repoName;

    // Clone into temp dir
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bb2-import-"));
    try {
      execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}/repo`, {
        timeout: 60_000,
        stdio: "pipe",
      });

      // Read all files
      const files = readDirRecursive(path.join(tmpDir, "repo"));

      // Create project
      const [project] = await db
        .insert(projects)
        .values({
          userId: req.user!.userId,
          name: projectName,
          description: parsed.data.description ?? null,
          repoName: `${urlParts[urlParts.length - 2]}/${repoName}`,
        })
        .returning();

      // Insert files
      if (files.length > 0) {
        await db.insert(projectFiles).values(
          files.map((f) => ({
            projectId: project.id,
            path: f.path,
            content: f.content,
            language: inferLanguage(f.path),
            lastModifiedBy: "import",
          }))
        );
      }

      res.status(201).json({ ...project, fileCount: files.length });
    } finally {
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } catch (error: any) {
    console.error("Import GitHub error:", error);
    const msg = error?.stderr?.toString?.() || error?.message || "Import failed";
    res.status(500).json({ message: msg.includes("not found") ? "Repository not found or private" : "Import failed" });
  }
});

// ─── Import from ZIP upload ─────────────────────────────────────────────────

router.post("/import/upload", async (req, res) => {
  // We expect the client to send JSON with base64-encoded zip content
  try {
    const { zipBase64, name, description } = req.body;
    if (!zipBase64) {
      res.status(400).json({ message: "No file provided" });
      return;
    }

    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip(Buffer.from(zipBase64, "base64"));
    const entries = zip.getEntries();

    // Detect common root dir to strip
    const paths = entries
      .filter((e) => !e.isDirectory)
      .map((e) => e.entryName);
    const commonRoot = paths.length > 0 && paths.every((p) => p.includes("/"))
      ? paths[0].split("/")[0] + "/"
      : "";

    const files: { path: string; content: string }[] = [];
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      let entryPath = entry.entryName;
      if (commonRoot && entryPath.startsWith(commonRoot)) {
        entryPath = entryPath.slice(commonRoot.length);
      }
      if (!entryPath || entryPath.startsWith(".") || SKIP_DIRS.has(entryPath.split("/")[0])) continue;
      const ext = path.extname(entryPath).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;
      if (entry.header.size > 500_000) continue;
      try {
        const content = entry.getData().toString("utf-8");
        files.push({ path: entryPath, content });
      } catch { /* skip */ }
    }

    const projectName = name || "Imported Project";
    const [project] = await db
      .insert(projects)
      .values({
        userId: req.user!.userId,
        name: projectName,
        description: description ?? null,
      })
      .returning();

    if (files.length > 0) {
      await db.insert(projectFiles).values(
        files.map((f) => ({
          projectId: project.id,
          path: f.path,
          content: f.content,
          language: inferLanguage(f.path),
          lastModifiedBy: "import",
        }))
      );
    }

    res.status(201).json({ ...project, fileCount: files.length });
  } catch (error) {
    console.error("Import upload error:", error);
    res.status(500).json({ message: "Import failed" });
  }
});

// ─── Templates ──────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { name: string; description: string; files: { path: string; content: string; language: string }[] }> = {
  blank: {
    name: "Blank Project",
    description: "Start from scratch",
    files: [],
  },
  "react-app": {
    name: "React App",
    description: "React + Vite starter",
    files: [
      { path: "package.json", language: "json", content: JSON.stringify({ name: "my-react-app", private: true, version: "0.0.0", type: "module", scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { react: "^18.3.0", "react-dom": "^18.3.0" }, devDependencies: { "@vitejs/plugin-react": "^4.3.0", vite: "^5.4.0" } }, null, 2) },
      { path: "index.html", language: "html", content: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>' },
      { path: "src/main.tsx", language: "typescript", content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);' },
      { path: "src/App.tsx", language: "typescript", content: 'export default function App() {\n  return (\n    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>\n      <h1>Hello, World!</h1>\n      <p>Edit src/App.tsx to get started.</p>\n    </div>\n  );\n}' },
      { path: "vite.config.ts", language: "typescript", content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n});' },
    ],
  },
  "node-api": {
    name: "Node.js API",
    description: "Express API starter",
    files: [
      { path: "package.json", language: "json", content: JSON.stringify({ name: "my-api", version: "1.0.0", type: "module", scripts: { dev: "tsx watch src/index.ts", build: "tsc", start: "node dist/index.js" }, dependencies: { express: "^4.21.0", cors: "^2.8.5" }, devDependencies: { "@types/express": "^4.17.21", "@types/cors": "^2.8.17", tsx: "^4.19.0", typescript: "^5.6.0" } }, null, 2) },
      { path: "src/index.ts", language: "typescript", content: 'import express from "express";\nimport cors from "cors";\nimport { router } from "./routes.js";\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\napp.use("/api", router);\n\nconst PORT = parseInt(process.env.PORT || "3000");\napp.listen(PORT, () => console.log(`API running on port ${PORT}`));' },
      { path: "src/routes.ts", language: "typescript", content: 'import { Router } from "express";\n\nexport const router = Router();\n\nrouter.get("/health", (req, res) => {\n  res.json({ status: "ok" });\n});\n\nrouter.get("/hello", (req, res) => {\n  res.json({ message: "Hello from BuilderBlue²!" });\n});' },
      { path: "tsconfig.json", language: "json", content: JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "bundler", outDir: "./dist", rootDir: "./src", strict: true, esModuleInterop: true, skipLibCheck: true }, include: ["src"] }, null, 2) },
    ],
  },
  "html-css": {
    name: "HTML/CSS/JS",
    description: "Simple static site",
    files: [
      { path: "index.html", language: "html", content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Site</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Edit index.html to get started.</p>\n  <script src="script.js"></script>\n</body>\n</html>' },
      { path: "style.css", language: "css", content: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n  background: #f5f5f5;\n  color: #333;\n}\n\nh1 {\n  margin-bottom: 1rem;\n}' },
      { path: "script.js", language: "javascript", content: 'console.log("Hello from BuilderBlue²!");' },
    ],
  },
  nextjs: {
    name: "Next.js",
    description: "Next.js starter with App Router",
    files: [
      { path: "package.json", language: "json", content: JSON.stringify({ name: "my-nextjs-app", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "^14.2.0", react: "^18.3.0", "react-dom": "^18.3.0" }, devDependencies: { "@types/node": "^22.0.0", "@types/react": "^18.3.0", typescript: "^5.6.0" } }, null, 2) },
      { path: "app/layout.tsx", language: "typescript", content: 'export const metadata = { title: "My App", description: "Built with BuilderBlue²" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}' },
      { path: "app/page.tsx", language: "typescript", content: 'export default function Home() {\n  return (\n    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>\n      <h1>Hello, World!</h1>\n      <p>Edit app/page.tsx to get started.</p>\n    </main>\n  );\n}' },
      { path: "next.config.js", language: "javascript", content: '/** @type {import("next").NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;' },
      { path: "tsconfig.json", language: "json", content: JSON.stringify({ compilerOptions: { target: "es5", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] } }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2) },
    ],
  },
};

// GET /api/projects/templates — list available templates
router.get("/templates/list", async (_req, res) => {
  const list = Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    name: t.name,
    description: t.description,
    fileCount: t.files.length,
  }));
  res.json(list);
});

// POST /api/projects — updated to support templateId
const createWithTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  templateId: z.string().optional(),
});

// Override the original POST to support templates
router.post("/from-template", async (req, res) => {
  try {
    const parsed = createWithTemplateSchema.safeParse(req.body);
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

    // Seed with template files if provided
    const template = parsed.data.templateId ? TEMPLATES[parsed.data.templateId] : null;
    if (template && template.files.length > 0) {
      await db.insert(projectFiles).values(
        template.files.map((f) => ({
          projectId: project.id,
          path: f.path,
          content: f.content,
          language: f.language,
          lastModifiedBy: "template",
        }))
      );
    }

    res.status(201).json({ ...project, fileCount: template?.files.length ?? 0 });
  } catch (error) {
    console.error("Create from template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
