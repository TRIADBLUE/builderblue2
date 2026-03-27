import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { useProject } from "../../hooks/useProject";
import { IDEShell } from "../../components/ide/IDEShell";

export default function IDEPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { project, loadProject, updateProject, isLoading } = useProject();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (params.id && isAuthenticated) {
      loadProject(params.id);
    }
  }, [params.id, isAuthenticated, loadProject]);

  if (authLoading || isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--triad-black)" }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--triad-black)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-builder)",
            color: "var(--cream)",
            fontSize: "16px",
          }}
        >
          Project not found
        </span>
      </div>
    );
  }

  return (
    <IDEShell
      projectId={project.id}
      projectName={project.name}
      branch={project.repoBranch ?? "main"}
      repoName={project.repoName ?? null}
      files={project.files}
      onProjectNameChange={(name) => updateProject(project.id, { name })}
      defaultArchitectConfig={project.defaultArchitectConfig ?? null}
      defaultBuilderConfig={project.defaultBuilderConfig ?? null}
    />
  );
}
