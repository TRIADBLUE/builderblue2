import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  customDomain: string | null;
  subdomain: string | null;
  repoName: string | null;
  createdAt: string;
}

interface Secret {
  id: string;
  key: string;
}

interface Collaborator {
  id: string;
  role: string;
  status: string;
  invitedEmail: string;
  userName: string | null;
}

export default function ProjectSettings() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [customDomain, setCustomDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");

  // Secrets
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  // Load project
  useEffect(() => {
    async function load() {
      if (!params.id) return;
      try {
        const data = await api.fetch<ProjectData>(`/api/projects/${params.id}`);
        setProject(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setVisibility(data.visibility);
        setCustomDomain(data.customDomain ?? "");
        setSubdomain(data.subdomain ?? "");
      } catch {
        setLocation("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  // Load collaborators
  useEffect(() => {
    async function loadCollabs() {
      if (!params.id) return;
      try {
        const data = await api.fetch<Collaborator[]>(`/api/collaborators/${params.id}`);
        setCollaborators(data);
      } catch {}
    }
    loadCollabs();
  }, [params.id]);

  // Save project settings
  const handleSave = useCallback(async () => {
    if (!params.id) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      await api.fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          customDomain: customDomain.trim() || null,
          subdomain: subdomain.trim() || null,
        },
      });
      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: any) {
      setSaveMessage(error?.message ?? "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [params.id, name, description, visibility, customDomain, subdomain]);

  // Add secret
  const handleAddSecret = useCallback(async () => {
    if (!params.id || !newSecretKey.trim() || !newSecretValue.trim()) return;
    try {
      await api.fetch(`/api/ide/secrets/${params.id}`, {
        method: "POST",
        body: { key: newSecretKey.trim(), value: newSecretValue.trim() },
      });
      setSecrets((prev) => [...prev, { id: Date.now().toString(), key: newSecretKey.trim() }]);
      setNewSecretKey("");
      setNewSecretValue("");
    } catch {}
  }, [params.id, newSecretKey, newSecretValue]);

  // Invite collaborator
  const handleInvite = useCallback(async () => {
    if (!params.id || !inviteEmail.trim()) return;
    try {
      await api.fetch("/api/collaborators", {
        method: "POST",
        body: {
          projectId: params.id,
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      });
      setCollaborators((prev) => [
        ...prev,
        { id: Date.now().toString(), role: inviteRole, status: "pending", invitedEmail: inviteEmail.trim(), userName: null },
      ]);
      setInviteEmail("");
    } catch {}
  }, [params.id, inviteEmail, inviteRole]);

  // Remove collaborator
  const handleRemoveCollab = useCallback(async (id: string) => {
    try {
      await api.fetch(`/api/collaborators/${id}`, { method: "DELETE" });
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }, []);

  // Archive project
  const handleArchive = useCallback(async () => {
    if (!params.id || !confirm("Are you sure you want to archive this project? This cannot be undone.")) return;
    try {
      await api.fetch(`/api/projects/${params.id}`, { method: "DELETE" });
      setLocation("/dashboard");
    } catch {}
  }, [params.id, setLocation]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (!project) return null;

  const sectionStyle = {
    background: "white",
    border: "1px solid rgba(74, 144, 217, 0.15)",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "16px",
  };

  const labelStyle = {
    fontFamily: "var(--font-content)",
    fontSize: "13px",
    color: "var(--steel-blue)",
    display: "block",
    marginBottom: "4px",
  };

  const inputStyle = {
    width: "100%",
    borderRadius: "6px",
    border: "1px solid rgba(74, 144, 217, 0.3)",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--triad-black)",
    fontFamily: "var(--font-content)",
    outline: "none",
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "640px" }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "bold", color: "var(--triad-black)" }}>
              Project Settings
            </h1>
            <p style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "var(--steel-blue)", marginTop: "2px" }}>
              {project.name}
            </p>
          </div>
          <button
            onClick={() => setLocation(`/ide/${project.id}`)}
            style={{
              fontFamily: "var(--font-button)",
              fontSize: "13px",
              color: "var(--deep-blue)",
              background: "transparent",
              border: "1px solid var(--deep-blue)",
              borderRadius: "6px",
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Open IDE
          </button>
        </div>

        {/* General */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)", marginBottom: "16px" }}>
            General
          </h2>
          <div className="mb-3">
            <label style={labelStyle}>Project Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div className="mb-3">
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div className="mb-4">
            <label style={labelStyle}>Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                fontFamily: "var(--font-button)",
                fontSize: "13px",
                color: "var(--cream)",
                background: "var(--deep-blue)",
                border: "none",
                borderRadius: "6px",
                padding: "8px 20px",
                cursor: isSaving ? "wait" : "pointer",
              }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saveMessage && (
              <span style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: saveMessage === "Saved" ? "#008060" : "var(--ruby-red)" }}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* Domain */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)", marginBottom: "16px" }}>
            Domain & URL
          </h2>
          <div className="mb-3">
            <label style={labelStyle}>Subdomain</label>
            <div className="flex items-center gap-1">
              <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} style={{ ...inputStyle, flex: 1 }} placeholder="my-app" />
              <span style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "var(--steel-blue)" }}>.builderblue2.com</span>
            </div>
          </div>
          <div className="mb-3">
            <label style={labelStyle}>Custom Domain</label>
            <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} style={inputStyle} placeholder="app.yourdomain.com" />
          </div>
        </div>

        {/* Environment Variables */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)", marginBottom: "16px" }}>
            Environment Variables
          </h2>
          {secrets.length > 0 && (
            <div className="mb-3">
              {secrets.map((s) => (
                <div key={s.id} className="mb-1 flex items-center justify-between rounded px-3 py-1.5" style={{ background: "rgba(74, 144, 217, 0.05)" }}>
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "13px", color: "var(--triad-black)" }}>{s.key}</span>
                  <span style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)" }}>••••••</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={newSecretKey} onChange={(e) => setNewSecretKey(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="KEY" />
            <input type="password" value={newSecretValue} onChange={(e) => setNewSecretValue(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="value" />
            <button
              onClick={handleAddSecret}
              disabled={!newSecretKey.trim() || !newSecretValue.trim()}
              style={{
                fontFamily: "var(--font-button)",
                fontSize: "12px",
                color: "var(--cream)",
                background: newSecretKey.trim() && newSecretValue.trim() ? "var(--deep-blue)" : "var(--steel-blue)",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                cursor: newSecretKey.trim() && newSecretValue.trim() ? "pointer" : "not-allowed",
                opacity: newSecretKey.trim() && newSecretValue.trim() ? 1 : 0.5,
                whiteSpace: "nowrap",
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Collaborators */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--triad-black)", marginBottom: "16px" }}>
            Collaborators
          </h2>
          {collaborators.length > 0 && (
            <div className="mb-3">
              {collaborators.map((c) => (
                <div key={c.id} className="mb-1 flex items-center justify-between rounded px-3 py-2" style={{ background: "rgba(74, 144, 217, 0.05)" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "var(--triad-black)" }}>
                      {c.userName ?? c.invitedEmail}
                    </span>
                    <span style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)", marginLeft: "8px" }}>
                      {c.role} · {c.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCollab(c.id)}
                    style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--ruby-red)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="email@example.com" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
              style={{
                fontFamily: "var(--font-button)",
                fontSize: "12px",
                color: "var(--cream)",
                background: inviteEmail.trim() ? "var(--deep-blue)" : "var(--steel-blue)",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                cursor: inviteEmail.trim() ? "pointer" : "not-allowed",
                opacity: inviteEmail.trim() ? 1 : 0.5,
                whiteSpace: "nowrap",
              }}
            >
              Invite
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ ...sectionStyle, border: "1px solid rgba(200, 50, 50, 0.3)" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "var(--ruby-red)", marginBottom: "8px" }}>
            Danger Zone
          </h2>
          <p style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "var(--steel-blue)", marginBottom: "12px" }}>
            Archiving a project hides it from your dashboard. This action cannot be undone.
          </p>
          <button
            onClick={handleArchive}
            style={{
              fontFamily: "var(--font-button)",
              fontSize: "13px",
              color: "var(--ruby-red)",
              background: "transparent",
              border: "1px solid var(--ruby-red)",
              borderRadius: "6px",
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            Archive Project
          </button>
        </div>
      </div>
    </AppShell>
  );
}
