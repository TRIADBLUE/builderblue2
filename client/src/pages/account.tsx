import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function Account() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Force light theme on this page
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => { if (prev) document.documentElement.setAttribute("data-theme", prev); };
  }, []);

  if (!user) {
    navigate("/login");
    return null;
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.fetch("/api/auth/onboarding", {
        method: "PATCH",
        body: {
          businessIndustry: user!.businessIndustry ?? "other",
          primaryGoal: user!.primaryGoal ?? "other",
        },
      });
      updateUser({ ...user!, name: name.trim() });
      setMessage({ type: "success", text: "Name updated" });
    } catch {
      setMessage({ type: "error", text: "Failed to update" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #FFF5ED)", color: "var(--text-primary, #09080E)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn"
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "13px", opacity: 0.6, marginBottom: "16px", padding: 0 }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, margin: "0 0 32px" }}>
          Account Settings
        </h1>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: "8px", marginBottom: "24px",
            fontFamily: "var(--font-content)", fontSize: "13px",
            background: message.type === "success" ? "rgba(0,128,96,0.15)" : "rgba(160,0,40,0.15)",
            color: message.type === "success" ? "#008060" : "var(--ruby-red)",
            border: `1px solid ${message.type === "success" ? "rgba(0,128,96,0.3)" : "rgba(160,0,40,0.3)"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Profile */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--steel-blue)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
            Profile
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontFamily: "var(--font-content)", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Name
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                  borderRadius: "6px", padding: "10px 14px", fontFamily: "var(--font-content)",
                  fontSize: "14px", color: "var(--text-primary)", outline: "none",
                }}
              />
              <button onClick={handleSaveName} disabled={saving || name.trim() === user.name} className="btn"
                style={{ background: "var(--deep-blue)", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: saving || name.trim() === user.name ? 0.4 : 1 }}>
                Save
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontFamily: "var(--font-content)", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <div style={{
              background: "var(--bg-input)", border: "1px solid var(--border-subtle)",
              borderRadius: "6px", padding: "10px 14px", fontFamily: "'Source Code Pro', monospace",
              fontSize: "14px", color: "var(--text-muted)",
            }}>
              {user.email}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontFamily: "var(--font-content)", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Role
            </label>
            <div style={{
              background: "var(--bg-input)", border: "1px solid var(--border-subtle)",
              borderRadius: "6px", padding: "10px 14px", fontFamily: "var(--font-content)",
              fontSize: "14px", color: "var(--text-muted)", textTransform: "capitalize",
            }}>
              {user.role}
            </div>
          </div>
        </div>

        {/* Quick Links — owner only */}
        {user.role === "owner" && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--steel-blue)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              Admin
            </h2>
            <button
              onClick={() => navigate("/admin/platform-keys")}
              className="btn"
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "var(--bg-hover)", border: "1px solid var(--border-subtle)",
                borderRadius: "8px", padding: "14px 18px", cursor: "pointer",
                fontFamily: "var(--font-content)", fontSize: "14px", color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontWeight: 600 }}>Platform Keys</div>
              <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
                Manage API keys and environment variables
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
