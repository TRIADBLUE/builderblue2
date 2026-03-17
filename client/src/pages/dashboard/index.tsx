import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import type { Project } from "@shared/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
                Create your first project
              </button>
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
