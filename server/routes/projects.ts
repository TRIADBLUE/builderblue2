import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import multer from "multer";
import AdmZip from "adm-zip";
import { db } from "../db.js";
import { projects, projectFiles } from "../../shared/schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

const githubImportSchema = z.object({
  repoUrl: z.string().url("Must be a valid URL"),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".mp3", ".mp4", ".avi", ".mov", ".wav",
  ".exe", ".dll", ".so", ".dylib",
  ".class", ".pyc", ".o", ".a",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build",
  "__pycache__", ".venv", "vendor", ".DS_Store",
]);

function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript", ".tsx": "typescriptreact",
    ".js": "javascript", ".jsx": "javascriptreact",
    ".json": "json", ".html": "html", ".css": "css",
    ".scss": "scss", ".less": "less", ".md": "markdown",
    ".py": "python", ".rb": "ruby", ".go": "go",
    ".rs": "rust", ".java": "java", ".c": "c",
    ".cpp": "cpp", ".h": "c", ".hpp": "cpp",
    ".sh": "shell", ".bash": "shell", ".zsh": "shell",
    ".yaml": "yaml", ".yml": "yaml", ".toml": "toml",
    ".xml": "xml", ".sql": "sql", ".graphql": "graphql",
    ".env": "dotenv", ".dockerfile": "dockerfile",
    ".svelte": "svelte", ".vue": "vue", ".php": "php",
  };
  const basename = path.basename(filePath).toLowerCase();
  if (basename === "dockerfile") return "dockerfile";
  if (basename === "makefile") return "makefile";
  if (basename === ".gitignore") return "gitignore";
  return map[ext] || "plaintext";
}

function readDirRecursive(
  dirPath: string,
  basePath: string = ""
): Array<{ path: string; content: string; language: string }> {
  const results: Array<{ path: string; content: string; language: string }> = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...readDirRecursive(fullPath, relativePath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 1024 * 1024) continue; // Skip files > 1MB
        const content = fs.readFileSync(fullPath, "utf-8");
        // Skip binary-looking content
        if (content.includes("\0")) continue;
        results.push({
          path: relativePath,
          content,
          language: getLanguageFromPath(entry.name),
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  return results;
}

// ─── CRUD Routes ────────────────────────────────────────────────────────────

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

// ─── Import Routes ──────────────────────────────────────────────────────────

// POST /api/projects/import/github — import from GitHub
router.post("/import/github", async (req, res) => {
  let tmpDir: string | null = null;

  try {
    const parsed = githubImportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0].message });
      return;
    }

    const { repoUrl, name, description } = parsed.data;

    // Validate GitHub URL format
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
    if (!githubPattern.test(repoUrl)) {
      res.status(400).json({ message: "Invalid GitHub repository URL. Expected format: https://github.com/owner/repo" });
      return;
    }

    // Extract repo name from URL
    const urlParts = repoUrl.replace(/\.git$/, "").split("/");
    const repoName = urlParts[urlParts.length - 1];
    const projectName = name || repoName;

    // Clone into temp directory
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bb2-github-"));
    const clonePath = path.join(tmpDir, repoName);

    try {
      execSync(`git clone --depth 1 "${repoUrl}" "${clonePath}"`, {
        timeout: 60_000,
        stdio: "pipe",
      });
    } catch (cloneErr: any) {
      const msg = cloneErr?.stderr?.toString() || "Failed to clone repository";
      res.status(400).json({ message: `Git clone failed: ${msg.trim()}` });
      return;
    }

    // Read all files from cloned repo
    const fileEntries = readDirRecursive(clonePath);

    // Create project
    const [project] = await db
      .insert(projects)
      .values({
        userId: req.user!.userId,
        name: projectName,
        description: description ?? `Imported from ${repoUrl}`,
        repoName: `${urlParts[urlParts.length - 2]}/${repoName}`,
      })
      .returning();

    // Insert files in batches of 50
    if (fileEntries.length > 0) {
      for (let i = 0; i < fileEntries.length; i += 50) {
        const batch = fileEntries.slice(i, i + 50);
        await db.insert(projectFiles).values(
          batch.map((f) => ({
            projectId: project.id,
            path: f.path,
            content: f.content,
            language: f.language,
            lastModifiedBy: "user" as const,
          }))
        );
      }
    }

    res.status(201).json({ ...project, fileCount: fileEntries.length });
  } catch (error) {
    console.error("GitHub import error:", error);
    res.status(500).json({ message: "Failed to import from GitHub" });
  } finally {
    // Clean up temp directory
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
});

// POST /api/projects/import/upload — upload ZIP file
router.post("/import/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    if (!req.file.originalname.endsWith(".zip")) {
      res.status(400).json({ message: "Only .zip files are supported" });
      return;
    }

    const projectName = (req.body.name as string)?.trim() || req.file.originalname.replace(/\.zip$/i, "");
    const description = (req.body.description as string)?.trim() || null;

    // Extract zip
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    // Find common root directory (many zips have a single top-level folder)
    let commonPrefix = "";
    const nonDirEntries = entries.filter((e) => !e.isDirectory);
    if (nonDirEntries.length > 0) {
      const firstPath = nonDirEntries[0].entryName;
      const firstSlash = firstPath.indexOf("/");
      if (firstSlash > 0) {
        const candidate = firstPath.substring(0, firstSlash + 1);
        const allMatch = nonDirEntries.every((e) => e.entryName.startsWith(candidate));
        if (allMatch) {
          commonPrefix = candidate;
        }
      }
    }

    // Read file entries
    const fileEntries: Array<{ path: string; content: string; language: string }> = [];
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      let relativePath = entry.entryName;
      if (commonPrefix && relativePath.startsWith(commonPrefix)) {
        relativePath = relativePath.substring(commonPrefix.length);
      }
      if (!relativePath) continue;

      // Skip hidden/system directories
      const parts = relativePath.split("/");
      if (parts.some((p) => SKIP_DIRS.has(p) || p.startsWith("."))) continue;

      const ext = path.extname(relativePath).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;

      try {
        const content = entry.getData().toString("utf-8");
        if (content.includes("\0")) continue; // binary check
        if (content.length > 1024 * 1024) continue; // skip > 1MB

        fileEntries.push({
          path: relativePath,
          content,
          language: getLanguageFromPath(relativePath),
        });
      } catch {
        // Skip unreadable entries
      }
    }

    // Create project
    const [project] = await db
      .insert(projects)
      .values({
        userId: req.user!.userId,
        name: projectName,
        description,
      })
      .returning();

    // Insert files in batches of 50
    if (fileEntries.length > 0) {
      for (let i = 0; i < fileEntries.length; i += 50) {
        const batch = fileEntries.slice(i, i + 50);
        await db.insert(projectFiles).values(
          batch.map((f) => ({
            projectId: project.id,
            path: f.path,
            content: f.content,
            language: f.language,
            lastModifiedBy: "user" as const,
          }))
        );
      }
    }

    res.status(201).json({ ...project, fileCount: fileEntries.length });
  } catch (error) {
    console.error("ZIP upload error:", error);
    res.status(500).json({ message: "Failed to process uploaded file" });
  }
});

export default router;
