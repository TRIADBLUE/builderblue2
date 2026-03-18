import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import type { Project } from "@shared/types";

type ImportTab = "github" | "upload";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [importDesc, setImportDesc] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importProgress, setImportProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects
  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<Project[]>("/api/projects");
        setProjects(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Create project
  const handleCreate = useCallback(async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const project = await api.fetch<Project>("/api/projects", {
        method: "POST",
        body: {
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || null,
        },
      });
      // Navigate directly to the IDE
      setLocation(`/ide/${project.id}`);
    } catch (error) {
      console.error("Create project error:", error);
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDesc, setLocation]);

  // Archive project
  const handleArchive = useCallback(async (id: string) => {
    try {
      await api.fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  }, []);

  // Import from GitHub
  const handleGithubImport = useCallback(async () => {
    if (!githubUrl.trim()) return;
    setIsImporting(true);
    setImportError("");
    setImportProgress("Cloning repository...");
    try {
      const result = await api.fetch<Project & { fileCount: number }>("/api/projects/import/github", {
        method: "POST",
        body: {
          repoUrl: githubUrl.trim(),
          name: importName.trim() || undefined,
          description: importDesc.trim() || undefined,
        },
      });
      setImportProgress(`Imported ${result.fileCount} files. Redirecting...`);
      setTimeout(() => setLocation(`/ide/${result.id}`), 500);
    } catch (error: any) {
      setImportError(error?.message || "Failed to import from GitHub");
      setImportProgress("");
    } finally {
      setIsImporting(false);
    }
  }, [githubUrl, importName, importDesc, setLocation]);

  // Upload ZIP
  const handleZipUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setImportError("Only .zip files are supported");
      return;
    }
    setIsImporting(true);
    setImportError("");
    setImportProgress("Uploading and extracting...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (importName.trim()) formData.append("name", importName.trim());
      if (importDesc.trim()) formData.append("description", importDesc.trim());

      const token = getAccessToken();
      const response = await globalThis.fetch("/api/projects/import/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }

      const result = await response.json();
      setImportProgress(`Imported ${result.fileCount} files. Redirecting...`);
      setTimeout(() => setLocation(`/ide/${result.id}`), 500);
    } catch (error: any) {
      setImportError(error?.message || "Failed to upload ZIP");
      setImportProgress("");
    } finally {
      setIsImporting(false);
    }
  }, [importName, importDesc, setLocation]);

  const resetImport = () => {
    setShowImport(false);
    setImportTab("github");
    setGithubUrl("");
    setImportName("");
    setImportDesc("");
    setImportError("");
    setImportProgress("");
    setDragOver(false);
  };

  // Shared input styles
  const inputStyle = {
    borderColor: "var(--steel-blue)",
    color: "var(--triad-black)",
    fontFamily: "var(--font-content)",
  };
  const labelStyle = {
    color: "var(--steel-blue)",
    fontFamily: "var(--font-content)",
  };

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--triad-black)", fontFamily: "var(--font-heading)" }}
            >
              Dashboard
            </h1>
            <p
              className="mt-1"
              style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)", fontSize: "14px" }}
            >
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowImport(true); setShowNewProject(false); }}
              className="rounded-md px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "transparent",
                color: "var(--deep-blue)",
                border: "1px solid var(--deep-blue)",
                cursor: "pointer",
                fontFamily: "var(--font-button)",
              }}
            >
              Import Project
            </button>
            <button
              onClick={() => { setShowNewProject(true); setShowImport(false); }}
              className="rounded-md px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "var(--deep-blue)",
                color: "var(--cream)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-button)",
              }}
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Import project modal */}
        {showImport && (
          <div
            className="mt-6 rounded-lg p-6"
            style={{
              background: "white",
              border: "1px solid var(--steel-blue)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              className="mb-4 text-lg font-bold"
              style={{ color: "var(--triad-black)", fontFamily: "var(--font-heading)" }}
            >
              Import Project
            </h2>

            {/* Tabs */}
            <div
              className="mb-5 flex gap-0 rounded-md overflow-hidden"
              style={{ border: "1px solid var(--steel-blue)" }}
            >
              <button
                onClick={() => { setImportTab("github"); setImportError(""); setImportProgress(""); }}
                className="flex-1 px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  background: importTab === "github" ? "var(--deep-blue)" : "transparent",
                  color: importTab === "github" ? "var(--cream)" : "var(--steel-blue)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                GitHub
              </button>
              <button
                onClick={() => { setImportTab("upload"); setImportError(""); setImportProgress(""); }}
                className="flex-1 px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  background: importTab === "upload" ? "var(--deep-blue)" : "transparent",
                  color: importTab === "upload" ? "var(--cream)" : "var(--steel-blue)",
                  border: "none",
                  borderLeft: "1px solid var(--steel-blue)",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                Upload ZIP
              </button>
            </div>

            {/* Shared fields */}
            <div className="mb-3">
              <label className="mb-1 block text-sm" style={labelStyle}>
                Project Name (optional)
              </label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Leave blank to use repo/file name"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm" style={labelStyle}>
                Description (optional)
              </label>
              <input
                type="text"
                value={importDesc}
                onChange={(e) => setImportDesc(e.target.value)}
                placeholder="A brief description"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            {/* GitHub tab */}
            {importTab === "github" && (
              <div className="mb-4">
                <label className="mb-1 block text-sm" style={labelStyle}>
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  autoFocus
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGithubImport();
                    if (e.key === "Escape") resetImport();
                  }}
                />
              </div>
            )}

            {/* Upload tab */}
            {importTab === "upload" && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleZipUpload(file);
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleZipUpload(file);
                  }}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all"
                  style={{
                    borderColor: dragOver ? "var(--deep-blue)" : "var(--steel-blue)",
                    background: dragOver ? "rgba(0, 60, 143, 0.04)" : "transparent",
                    cursor: isImporting ? "not-allowed" : "pointer",
                    opacity: isImporting ? 0.5 : 1,
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--deep-blue)", fontFamily: "var(--font-content)" }}
                  >
                    Drop a .zip file here or click to browse
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)" }}
                  >
                    Maximum 100 MB
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {importError && (
              <div
                className="mb-3 rounded-md px-3 py-2 text-sm"
                style={{
                  background: "rgba(220, 38, 38, 0.08)",
                  color: "#dc2626",
                  fontFamily: "var(--font-content)",
                }}
              >
                {importError}
              </div>
            )}

            {/* Progress */}
            {importProgress && (
              <div
                className="mb-3 rounded-md px-3 py-2 text-sm"
                style={{
                  background: "rgba(0, 60, 143, 0.06)",
                  color: "var(--deep-blue)",
                  fontFamily: "var(--font-content)",
                }}
              >
                {importProgress}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {importTab === "github" && (
                <button
                  onClick={handleGithubImport}
                  disabled={!githubUrl.trim() || isImporting}
                  className="rounded-md px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: !githubUrl.trim() || isImporting
                      ? "var(--steel-blue)"
                      : "var(--deep-blue)",
                    color: "var(--cream)",
                    border: "none",
                    cursor: !githubUrl.trim() || isImporting ? "not-allowed" : "pointer",
                    opacity: !githubUrl.trim() || isImporting ? 0.5 : 1,
                    fontFamily: "var(--font-button)",
                  }}
                >
                  {isImporting ? "Importing..." : "Import from GitHub"}
                </button>
              )}
              <button
                onClick={resetImport}
                className="rounded-md px-4 py-2 text-sm transition-all"
                style={{
                  background: "transparent",
                  color: "var(--steel-blue)",
                  border: "1px solid var(--steel-blue)",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* New project form */}
        {showNewProject && (
          <div
            className="mt-6 rounded-lg p-6"
            style={{
              background: "white",
              border: "1px solid var(--steel-blue)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              className="mb-4 text-lg font-bold"
              style={{ color: "var(--triad-black)", fontFamily: "var(--font-heading)" }}
            >
              Create a New Project
            </h2>
            <div className="mb-3">
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)" }}
              >
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome App"
                autoFocus
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--steel-blue)",
                  color: "var(--triad-black)",
                  fontFamily: "var(--font-content)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowNewProject(false);
                }}
              />
            </div>
            <div className="mb-4">
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)" }}
              >
                Description (optional)
              </label>
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="A brief description of what you're building"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--steel-blue)",
                  color: "var(--triad-black)",
                  fontFamily: "var(--font-content)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newProjectName.trim() || isCreating}
                className="rounded-md px-5 py-2 text-sm font-semibold transition-all"
                style={{
                  background: !newProjectName.trim()
                    ? "var(--steel-blue)"
                    : "var(--deep-blue)",
                  color: "var(--cream)",
                  border: "none",
                  cursor: !newProjectName.trim() ? "not-allowed" : "pointer",
                  opacity: !newProjectName.trim() ? 0.5 : 1,
                  fontFamily: "var(--font-button)",
                }}
              >
                {isCreating ? "Creating..." : "Create & Open IDE"}
              </button>
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName("");
                  setNewProjectDesc("");
                }}
                className="rounded-md px-4 py-2 text-sm transition-all"
                style={{
                  background: "transparent",
                  color: "var(--steel-blue)",
                  border: "1px solid var(--steel-blue)",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Projects list */}
        <div className="mt-8">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : projects.length === 0 && !showNewProject && !showImport ? (
            <div
              className="rounded-lg border border-dashed p-12 text-center"
              style={{ borderColor: "var(--steel-blue)" }}
            >
              <p
                style={{
                  color: "var(--steel-blue)",
                  fontFamily: "var(--font-content)",
                  fontSize: "16px",
                  marginBottom: "12px",
                }}
              >
                No projects yet.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowNewProject(true)}
                  className="rounded-md px-6 py-2.5 text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: "var(--deep-blue)",
                    color: "var(--cream)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-button)",
                  }}
                >
                  Create your first project
                </button>
                <span style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)", fontSize: "14px" }}>or</span>
                <button
                  onClick={() => setShowImport(true)}
                  className="rounded-md px-6 py-2.5 text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: "transparent",
                    color: "var(--deep-blue)",
                    border: "1px solid var(--deep-blue)",
                    cursor: "pointer",
                    fontFamily: "var(--font-button)",
                  }}
                >
                  Import existing project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group rounded-lg p-5 transition-all hover:shadow-md"
                  style={{
                    background: "white",
                    border: "1px solid rgba(74, 144, 217, 0.2)",
                    cursor: "pointer",
                  }}
                  onClick={() => setLocation(`/ide/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-bold"
                        style={{
                          color: "var(--triad-black)",
                          fontFamily: "var(--font-heading)",
                          fontSize: "16px",
                        }}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p
                          className="mt-1 text-sm"
                          style={{
                            color: "var(--steel-blue)",
                            fontFamily: "var(--font-content)",
                            opacity: 0.7,
                          }}
                        >
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Archive this project?")) {
                          handleArchive(project.id);
                        }
                      }}
                      className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--steel-blue)",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "var(--font-content)",
                      }}
                    >
                      Archive
                    </button>
                  </div>
                  <div
                    className="mt-3 flex items-center gap-3"
                    style={{
                      fontFamily: "var(--font-content)",
                      fontSize: "11px",
                      color: "var(--steel-blue)",
                      opacity: 0.5,
                    }}
                  >
                    <span>
                      Created{" "}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    {project.lastBuiltAt && (
                      <span>
                        Last built{" "}
                        {new Date(project.lastBuiltAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
