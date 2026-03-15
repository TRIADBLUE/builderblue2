import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Project, ProjectFile } from "@shared/types";

interface ProjectWithFiles extends Project {
  files: ProjectFile[];
}

interface UseProjectReturn {
  project: ProjectWithFiles | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  loadProject: (id: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, data: Partial<Pick<Project, "name" | "description">>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
}

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<ProjectWithFiles | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetch<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetch<ProjectWithFiles>(`/api/projects/${id}`);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string, description?: string) => {
    const data = await api.fetch<Project>("/api/projects", {
      method: "POST",
      body: { name, description },
    });
    setProjects((prev) => [...prev, data]);
    return data;
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<Pick<Project, "name" | "description">>) => {
    const updated = await api.fetch<Project>(`/api/projects/${id}`, {
      method: "PATCH",
      body: data,
    });
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (project?.id === id) {
      setProject((prev) => prev ? { ...prev, ...updated } : null);
    }
  }, [project?.id]);

  const archiveProject = useCallback(async (id: string) => {
    await api.fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (project?.id === id) setProject(null);
  }, [project?.id]);

  return {
    project,
    projects,
    isLoading,
    error,
    loadProject,
    loadProjects,
    createProject,
    updateProject,
    archiveProject,
  };
}
