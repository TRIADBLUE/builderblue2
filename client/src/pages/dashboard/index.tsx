import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import type { Project } from "@shared/types";

type SortKey = "name" | "created" | "updated";
type CreateMode = "blank" | "template" | "github" | "upload";

interface Template {
  id: string;
  name: string;
  description: string;
  fileCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("blank");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [error, setError] = useState("");

  // GitHub import
  const [githubUrl, setGithubUrl] = useState("");

  // ZIP upload
  const [zipFile, setZipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    return result;
  }, [projects, searchQuery, sortBy]);

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

  // Load templates when template mode selected
  useEffect(() => {
    if (createMode === "template" && templates.length === 0) {
      api.fetch<Template[]>("/api/projects/templates/list")
        .then(setTemplates)
        .catch(() => {});
    }
  }, [createMode, templates.length]);

  // Reset form
  const resetForm = useCallback(() => {
    setShowNewProject(false);
    setCreateMode("blank");
    setNewProjectName("");
    setNewProjectDesc("");
    setGithubUrl("");
    setZipFile(null);
    setSelectedTemplate("");
    setError("");
  }, []);

  // Create blank project
  const handleCreateBlank = useCallback(async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    setError("");
    try {
      const project = await api.fetch<Project>("/api/projects", {
        method: "POST",
        body: {
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || null,
        },
      });
      setLocation(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDesc, setLocation]);

  // Create from template
  const handleCreateFromTemplate = useCallback(async () => {
    if (!newProjectName.trim() || !selectedTemplate) return;
    setIsCreating(true);
    setError("");
    try {
      const project = await api.fetch<Project>("/api/projects/from-template", {
        method: "POST",
        body: {
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || null,
          templateId: selectedTemplate,
        },
      });
      setLocation(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create from template");
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDesc, selectedTemplate, setLocation]);

  // Import from GitHub
  const handleImportGithub = useCallback(async () => {
    if (!githubUrl.trim()) return;
    setIsCreating(true);
    setError("");
    try {
      const project = await api.fetch<Project>("/api/projects/import/github", {
        method: "POST",
        body: {
          repoUrl: githubUrl.trim(),
          name: newProjectName.trim() || undefined,
          description: newProjectDesc.trim() || null,
        },
      });
      setLocation(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to import from GitHub");
    } finally {
      setIsCreating(false);
    }
  }, [githubUrl, newProjectName, newProjectDesc, setLocation]);

  // Upload ZIP
  const handleUploadZip = useCallback(async () => {
    if (!zipFile) return;
    setIsCreating(true);
    setError("");
    try {
      const buffer = await zipFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const project = await api.fetch<Project>("/api/projects/import/upload", {
        method: "POST",
        body: {
          zipBase64: base64,
          name: newProjectName.trim() || zipFile.name.replace(/\.zip$/i, ""),
          description: newProjectDesc.trim() || null,
        },
      });
      setLocation(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to upload project");
    } finally {
      setIsCreating(false);
    }
  }, [zipFile, newProjectName, newProjectDesc, setLocation]);

  // Handle create based on mode
  const handleCreate = useCallback(() => {
    switch (createMode) {
      case "blank":
        return handleCreateBlank();
      case "template":
        return handleCreateFromTemplate();
      case "github":
        return handleImportGithub();
      case "upload":
        return handleUploadZip();
    }
  }, [createMode, handleCreateBlank, handleCreateFromTemplate, handleImportGithub, handleUploadZip]);

  // Archive project
  const handleArchive = useCallback(async (id: string) => {
    try {
      await api.fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const tabStyle = (active: boolean) => ({
    fontFamily: "var(--font-button)" as const,
    fontSize: "12px",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer" as const,
    background: active ? "var(--deep-blue)" : "transparent",
    color: active ? "var(--cream)" : "var(--steel-blue)",
    transition: "all 0.15s",
  });

  const inputStyle = {
    width: "100%",
    borderRadius: "6px",
    border: "1px solid var(--steel-blue)",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--triad-black)",
    fontFamily: "var(--font-content)",
    outline: "none",
  };

  const labelStyle = {
    fontFamily: "var(--font-content)",
    fontSize: "13px",
    color: "var(--steel-blue)",
    display: "block" as const,
    marginBottom: "4px",
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
          <button
            onClick={() => setShowNewProject(true)}
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
              New Project
            </h2>

            {/* Mode tabs */}
            <div className="mb-5 flex gap-2" style={{ borderBottom: "1px solid rgba(74,144,217,0.15)", paddingBottom: "10px" }}>
              <button style={tabStyle(createMode === "blank")} onClick={() => setCreateMode("blank")}>Blank</button>
              <button style={tabStyle(createMode === "template")} onClick={() => setCreateMode("template")}>Template</button>
              <button style={tabStyle(createMode === "github")} onClick={() => setCreateMode("github")}>Import from GitHub</button>
              <button style={tabStyle(createMode === "upload")} onClick={() => setCreateMode("upload")}>Upload ZIP</button>
            </div>

            {/* GitHub URL field */}
            {createMode === "github" && (
              <div className="mb-3">
                <label style={labelStyle}>GitHub Repository URL</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  autoFocus
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                />
              </div>
            )}

            {/* ZIP upload field */}
            {createMode === "upload" && (
              <div className="mb-3">
                <label style={labelStyle}>Project ZIP File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all hover:border-solid"
                  style={{
                    borderColor: zipFile ? "var(--deep-blue)" : "var(--steel-blue)",
                    cursor: "pointer",
                    background: zipFile ? "rgba(26, 61, 143, 0.03)" : "transparent",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-content)", fontSize: "14px", color: zipFile ? "var(--deep-blue)" : "var(--steel-blue)" }}>
                    {zipFile ? `Selected: ${zipFile.name}` : "Click to select a .zip file or drag & drop"}
                  </span>
                </div>
              </div>
            )}

            {/* Template selector */}
            {createMode === "template" && (
              <div className="mb-3">
                <label style={labelStyle}>Choose a Template</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className="rounded-lg p-3 transition-all"
                      style={{
                        border: selectedTemplate === t.id ? "2px solid var(--deep-blue)" : "1px solid rgba(74,144,217,0.2)",
                        background: selectedTemplate === t.id ? "rgba(26, 61, 143, 0.03)" : "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: "bold", color: "var(--triad-black)" }}>
                        {t.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)", marginTop: "2px" }}>
                        {t.description}
                      </div>
                      <div style={{ fontFamily: "var(--font-content)", fontSize: "10px", color: "var(--steel-blue)", opacity: 0.5, marginTop: "4px" }}>
                        {t.fileCount} files
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Name & Description (always shown) */}
            <div className="mb-3">
              <label style={labelStyle}>
                Project Name{createMode === "github" ? " (optional — defaults to repo name)" : ""}
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={createMode === "github" ? "Leave blank to use repo name" : "My Awesome App"}
                autoFocus={createMode === "blank"}
                style={inputStyle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") resetForm();
                }}
              />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Description (optional)</label>
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="A brief description of what you're building"
                style={inputStyle}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-3 rounded-md px-3 py-2"
                style={{ background: "rgba(200,50,50,0.08)", color: "var(--ruby-red)", fontFamily: "var(--font-content)", fontSize: "13px" }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={isCreating || (
                  createMode === "blank" && !newProjectName.trim() ||
                  createMode === "template" && (!newProjectName.trim() || !selectedTemplate) ||
                  createMode === "github" && !githubUrl.trim() ||
                  createMode === "upload" && !zipFile
                )}
                className="rounded-md px-5 py-2 text-sm font-semibold transition-all"
                style={{
                  background: "var(--deep-blue)",
                  color: "var(--cream)",
                  border: "none",
                  cursor: isCreating ? "wait" : "pointer",
                  opacity: isCreating ? 0.7 : 1,
                  fontFamily: "var(--font-button)",
                }}
              >
                {isCreating
                  ? createMode === "github"
                    ? "Importing..."
                    : createMode === "upload"
                    ? "Uploading..."
                    : "Creating..."
                  : createMode === "github"
                  ? "Import & Open IDE"
                  : createMode === "upload"
                  ? "Upload & Open IDE"
                  : "Create & Open IDE"}
              </button>
              <button
                onClick={resetForm}
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

        {/* Search & Sort bar */}
        {projects.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-md border px-3 py-2 pl-9 text-sm outline-none"
                style={{
                  borderColor: "rgba(74, 144, 217, 0.3)",
                  color: "var(--triad-black)",
                  fontFamily: "var(--font-content)",
                  background: "white",
                }}
              />
              <svg
                className="absolute left-3 top-2.5"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--steel-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-md border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "rgba(74, 144, 217, 0.3)",
                color: "var(--triad-black)",
                fontFamily: "var(--font-content)",
                background: "white",
                cursor: "pointer",
              }}
            >
              <option value="updated">Last updated</option>
              <option value="created">Newest first</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        )}

        {/* Projects list */}
        <div className="mt-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : projects.length === 0 && !showNewProject ? (
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
                + New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.length === 0 && searchQuery ? (
                <div
                  className="col-span-full py-8 text-center"
                  style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)", fontSize: "14px" }}
                >
                  No projects matching "{searchQuery}"
                </div>
              ) : null}
              {filteredProjects.map((project) => (
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
