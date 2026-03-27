import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import type { Project, AICombo, AIModelConfig } from "@shared/types";

type SortKey = "name" | "created" | "updated";
type ProjectType = null | "new" | "existing";
type NewMode = "fresh" | "template" | "repo";
type ExistingMode = "github" | "upload";

interface Template {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  matchScore?: number;
  tags?: { industries: string[]; goals: string[] };
}

interface Recommendations {
  templates: Template[];
  aiCombos: AICombo[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [newMode, setNewMode] = useState<NewMode>("fresh");
  const [existingMode, setExistingMode] = useState<ExistingMode>("github");
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

  // Onboarding recommendations
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<AICombo | null>(null);
  const [wizardStep, setWizardStep] = useState<"type" | "recs" | "combo" | "details">("type");

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

  // Load templates when needed
  useEffect(() => {
    if (newMode === "template" && templates.length === 0) {
      api.fetch<Template[]>("/api/projects/templates/list")
        .then(setTemplates)
        .catch(() => {});
    }
  }, [newMode, templates.length]);

  // Fetch recommendations when user picks "new" and has onboarding data
  const hasOnboarding = !!user?.businessIndustry && !!user?.primaryGoal;
  useEffect(() => {
    if (projectType === "new" && hasOnboarding && !recommendations) {
      api.fetch<Recommendations>(
        `/api/projects/recommendations?industry=${user!.businessIndustry}&goal=${user!.primaryGoal}`
      )
        .then((recs) => {
          setRecommendations(recs);
          // Pre-select the recommended combo
          const rec = recs.aiCombos.find((c) => c.recommended);
          if (rec) setSelectedCombo(rec);
        })
        .catch(() => {});
    }
  }, [projectType, hasOnboarding, recommendations, user]);

  // Reset form
  const resetForm = useCallback(() => {
    setShowAddProject(false);
    setProjectType(null);
    setNewMode("fresh");
    setExistingMode("github");
    setNewProjectName("");
    setNewProjectDesc("");
    setGithubUrl("");
    setZipFile(null);
    setSelectedTemplate("");
    setError("");
    setRecommendations(null);
    setSelectedCombo(null);
    setWizardStep("type");
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
      const body: Record<string, unknown> = {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
        templateId: selectedTemplate,
      };
      if (selectedCombo) {
        body.defaultArchitectConfig = {
          provider: selectedCombo.architectProvider,
          model: selectedCombo.architectModel,
        };
        body.defaultBuilderConfig = {
          provider: selectedCombo.builderProvider,
          model: selectedCombo.builderModel,
        };
      }
      const project = await api.fetch<Project>("/api/projects/from-template", {
        method: "POST",
        body,
      });
      setLocation(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create from template");
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDesc, selectedTemplate, selectedCombo, setLocation]);

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
    if (projectType === "new") {
      switch (newMode) {
        case "fresh": return handleCreateBlank();
        case "template": return handleCreateFromTemplate();
        case "repo": return handleCreateBlank(); // creates project + connects repo later
      }
    } else if (projectType === "existing") {
      switch (existingMode) {
        case "github": return handleImportGithub();
        case "upload": return handleUploadZip();
      }
    }
  }, [projectType, newMode, existingMode, handleCreateBlank, handleCreateFromTemplate, handleImportGithub, handleUploadZip]);

  // Archive project
  const handleArchive = useCallback(async (id: string) => {
    try {
      await api.fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  }, []);

  // Can submit?
  const canSubmit = (() => {
    if (isCreating) return false;
    if (projectType === "new") {
      if (newMode === "fresh" || newMode === "repo") return !!newProjectName.trim();
      if (newMode === "template") return !!newProjectName.trim() && !!selectedTemplate;
    }
    if (projectType === "existing") {
      if (existingMode === "github") return !!githubUrl.trim();
      if (existingMode === "upload") return !!zipFile;
    }
    return false;
  })();

  // Button label
  const buttonLabel = (() => {
    if (isCreating) {
      if (projectType === "existing" && existingMode === "github") return "Importing...";
      if (projectType === "existing" && existingMode === "upload") return "Uploading...";
      return "Creating...";
    }
    return "Open in IDE";
  })();

  const typeCardStyle = (active: boolean) => ({
    flex: 1,
    padding: "20px",
    borderRadius: "10px",
    border: active ? "2px solid var(--deep-blue)" : "1px solid rgba(74,144,217,0.2)",
    background: active ? "rgba(20, 40, 125, 0.04)" : "white",
    cursor: "pointer" as const,
    textAlign: "center" as const,
    transition: "all 0.15s",
  });

  const subTabStyle = (active: boolean) => ({
    fontFamily: "var(--font-button)" as const,
    fontSize: "12px",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none" as const,
    cursor: "pointer" as const,
    background: active ? "var(--deep-blue)" : "transparent",
    color: active ? "#FFF5ED" : "var(--steel-blue)",
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
            onClick={() => setShowAddProject(true)}
            className="btn rounded-md px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "var(--deep-blue)",
              color: "#FFF5ED",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-button)",
            }}
          >
            + Add Project
          </button>
        </div>

        {/* Add Project form */}
        {showAddProject && (
          <div
            className="mt-6 rounded-lg p-6"
            style={{
              background: "white",
              border: "1px solid var(--steel-blue)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              className="mb-5 text-lg font-bold"
              style={{ color: "var(--triad-black)", fontFamily: "var(--font-heading)" }}
            >
              Add Project
            </h2>

            {/* Step 1: New or Existing? */}
            {!projectType && wizardStep === "type" && (
              <div className="flex gap-4">
                <div
                  style={typeCardStyle(false)}
                  onClick={() => {
                    setProjectType("new");
                    if (hasOnboarding) {
                      setWizardStep("recs");
                    } else {
                      setWizardStep("details");
                    }
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--deep-blue)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(74,144,217,0.2)"; }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>✨</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)" }}>
                    New Project
                  </div>
                  <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", marginTop: "4px" }}>
                    Start from scratch, use a template, or connect a new repo
                  </div>
                </div>
                <div
                  style={typeCardStyle(false)}
                  onClick={() => { setProjectType("existing"); setWizardStep("details"); }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--deep-blue)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(74,144,217,0.2)"; }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📂</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)" }}>
                    Existing Project
                  </div>
                  <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", marginTop: "4px" }}>
                    Import from GitHub or upload a ZIP of your existing code
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Templates (onboarding users only) */}
            {projectType === "new" && wizardStep === "recs" && recommendations && (
              <>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", color: "var(--triad-black)", marginBottom: "4px" }}>
                  Recommended for your business
                </h3>
                <p style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", marginBottom: "16px" }}>
                  Based on what you told us, these templates are the best fit. Pick one, or scroll down for all options.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
                  {recommendations.templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t.id);
                        setNewMode("template");
                        setWizardStep("combo");
                      }}
                      className="rounded-lg p-3 transition-all"
                      style={{
                        border: "1px solid rgba(74,144,217,0.2)",
                        background: "white",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--deep-blue)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(74,144,217,0.2)"; }}
                    >
                      {t.matchScore === 2 && (
                        <span style={{
                          position: "absolute", top: "6px", right: "6px",
                          fontFamily: "var(--font-label)", fontSize: "9px",
                          background: "var(--deep-blue)", color: "#FFF5ED",
                          padding: "1px 6px", borderRadius: "4px",
                        }}>
                          Best match
                        </span>
                      )}
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: "bold", color: "var(--triad-black)" }}>
                        {t.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)", marginTop: "2px" }}>
                        {t.description}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewMode("fresh");
                      setSelectedTemplate("");
                      setWizardStep("combo");
                    }}
                    style={{
                      fontFamily: "var(--font-content)", fontSize: "12px",
                      color: "var(--steel-blue)", background: "none",
                      border: "none", cursor: "pointer", textDecoration: "underline",
                    }}
                  >
                    Skip — start from scratch
                  </button>
                  <button
                    onClick={() => { setProjectType(null); setWizardStep("type"); }}
                    style={{
                      fontFamily: "var(--font-content)", fontSize: "12px",
                      color: "var(--steel-blue)", background: "none",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}

            {/* AI Combo Selection (onboarding users only) */}
            {projectType === "new" && wizardStep === "combo" && recommendations && (
              <>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", color: "var(--triad-black)", marginBottom: "4px" }}>
                  Choose your AI team
                </h3>
                <p style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", marginBottom: "16px" }}>
                  Each project uses two AI assistants — an Architect that plans and a Builder that writes code. Here are the best combos for what you are building.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {recommendations.aiCombos.map((combo) => (
                    <div
                      key={combo.id}
                      onClick={() => setSelectedCombo(combo)}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border: selectedCombo?.id === combo.id
                          ? "2px solid var(--deep-blue)"
                          : "1px solid rgba(74,144,217,0.2)",
                        background: selectedCombo?.id === combo.id
                          ? "rgba(20, 40, 125, 0.04)"
                          : "white",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                    >
                      {combo.recommended && (
                        <span style={{
                          position: "absolute", top: "10px", right: "10px",
                          fontFamily: "var(--font-label)", fontSize: "9px",
                          background: "var(--deep-blue)", color: "#FFF5ED",
                          padding: "2px 8px", borderRadius: "4px",
                        }}>
                          Recommended
                        </span>
                      )}
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "bold", color: "var(--triad-black)", marginBottom: "4px" }}>
                        {combo.label}
                      </div>
                      <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", marginBottom: "8px" }}>
                        {combo.reason}
                      </div>
                      <div style={{ fontFamily: "var(--font-label)", fontSize: "10px", color: "rgba(9,8,14,0.4)", display: "flex", gap: "12px" }}>
                        <span>Architect: {combo.architectProvider} / {combo.architectModel.split("-").slice(0, 2).join(" ")}</span>
                        <span>Builder: {combo.builderProvider} / {combo.builderModel.split("-").slice(0, 2).join(" ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWizardStep("details")}
                    className="btn rounded-md px-5 py-2 text-sm font-semibold"
                    style={{
                      background: "var(--deep-blue)", color: "#FFF5ED",
                      border: "none", cursor: "pointer", fontFamily: "var(--font-button)",
                    }}
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCombo(null);
                      setWizardStep("details");
                    }}
                    style={{
                      fontFamily: "var(--font-content)", fontSize: "12px",
                      color: "var(--steel-blue)", background: "none",
                      border: "none", cursor: "pointer", textDecoration: "underline",
                    }}
                  >
                    Skip — I will pick my own later
                  </button>
                  <button
                    onClick={() => setWizardStep("recs")}
                    style={{
                      fontFamily: "var(--font-content)", fontSize: "12px",
                      color: "var(--steel-blue)", background: "none",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}

            {/* New Project details */}
            {projectType === "new" && wizardStep === "details" && (
              <>
                <div className="mb-5 flex gap-2" style={{ borderBottom: "1px solid rgba(74,144,217,0.15)", paddingBottom: "10px" }}>
                  <button style={subTabStyle(newMode === "fresh")} onClick={() => setNewMode("fresh")}>Start Fresh</button>
                  <button style={subTabStyle(newMode === "template")} onClick={() => setNewMode("template")}>From Template</button>
                  <button style={subTabStyle(newMode === "repo")} onClick={() => setNewMode("repo")}>Connect Repo</button>
                </div>

                {/* Template selector */}
                {newMode === "template" && (
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

                {/* Connect repo hint */}
                {newMode === "repo" && (
                  <div className="mb-3 rounded-md px-3 py-2" style={{ background: "rgba(74,144,217,0.05)", fontFamily: "var(--font-content)", fontSize: "13px", color: "var(--steel-blue)" }}>
                    A new GitHub repository will be created and linked to this project. You can configure the repo in Project Settings after opening the IDE.
                  </div>
                )}

                {/* Name & Description */}
                <div className="mb-3">
                  <label style={labelStyle}>Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome App"
                    autoFocus
                    style={inputStyle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) handleCreate();
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
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleCreate(); }}
                  />
                </div>
              </>
            )}

            {/* Existing Project options */}
            {projectType === "existing" && wizardStep === "details" && (
              <>
                <div className="mb-5 flex gap-2" style={{ borderBottom: "1px solid rgba(74,144,217,0.15)", paddingBottom: "10px" }}>
                  <button style={subTabStyle(existingMode === "github")} onClick={() => setExistingMode("github")}>From GitHub</button>
                  <button style={subTabStyle(existingMode === "upload")} onClick={() => setExistingMode("upload")}>Upload ZIP</button>
                </div>

                {/* GitHub URL */}
                {existingMode === "github" && (
                  <div className="mb-3">
                    <label style={labelStyle}>GitHub Repository URL</label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      autoFocus
                      style={inputStyle}
                      onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleCreate(); }}
                    />
                  </div>
                )}

                {/* ZIP upload */}
                {existingMode === "upload" && (
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

                {/* Name & Description */}
                <div className="mb-3">
                  <label style={labelStyle}>
                    Project Name{existingMode === "github" ? " (optional — defaults to repo name)" : ""}
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder={existingMode === "github" ? "Leave blank to use repo name" : "My Project"}
                    style={inputStyle}
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleCreate(); }}
                  />
                </div>
                <div className="mb-4">
                  <label style={labelStyle}>Description (optional)</label>
                  <input
                    type="text"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="A brief description of this project"
                    style={inputStyle}
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleCreate(); }}
                  />
                </div>
              </>
            )}

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
            {projectType && wizardStep === "details" && (
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!canSubmit}
                  className="btn rounded-md px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: canSubmit ? "var(--deep-blue)" : "var(--steel-blue)",
                    color: "#FFF5ED",
                    border: "none",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    opacity: canSubmit ? 1 : 0.5,
                    fontFamily: "var(--font-button)",
                  }}
                >
                  {buttonLabel}
                </button>
                <button
                  onClick={() => {
                    if (hasOnboarding && projectType === "new") {
                      setWizardStep("combo");
                    } else {
                      setProjectType(null);
                      setWizardStep("type");
                    }
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
                  Back
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-md px-4 py-2 text-sm transition-all"
                  style={{
                    background: "transparent",
                    color: "var(--steel-blue)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-button)",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Cancel on step 1 */}
            {!projectType && (
              <div className="mt-4">
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
            )}
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
          ) : projects.length === 0 && !showAddProject ? (
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
                onClick={() => setShowAddProject(true)}
                className="btn rounded-md px-6 py-2.5 text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: "var(--deep-blue)",
                  color: "#FFF5ED",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                + Add Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.length === 0 && searchQuery ? (
                <div
                  className="col-span-full py-8 text-center"
                  style={{ color: "var(--steel-blue)", fontFamily: "var(--font-content)", fontSize: "14px" }}
                >
                  No projects matching &ldquo;{searchQuery}&rdquo;
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
