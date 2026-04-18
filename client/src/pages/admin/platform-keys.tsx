import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

interface PlatformKey {
  key: string;
  label: string;
  description: string;
  group: string;
  placeholder: string;
  required: boolean;
  isSet: boolean;
  maskedValue: string;
  value: string;
}

export default function PlatformKeys() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [keys, setKeys] = useState<PlatformKey[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  useEffect(() => {
    if (user && user.role !== "owner") navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    try {
      const res = await api.fetch<{ keys: PlatformKey[] }>("/api/admin/platform-keys");
      setKeys(res.keys);
    } catch {
      setMessage({ type: "error", text: "Failed to load configuration" });
    } finally {
      setLoading(false);
    }
  }

  function startEditing(key: string) {
    setEditing((prev) => new Set(prev).add(key));
    const existing = keys.find((k) => k.key === key);
    setEditValues((prev) => ({ ...prev, [key]: existing?.value ?? "" }));
  }

  function cancelEditing(key: string) {
    setEditing((prev) => { const next = new Set(prev); next.delete(key); return next; });
    setEditValues((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function saveKey(key: string) {
    const value = editValues[key];
    if (!value?.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.fetch<{ keys: PlatformKey[] }>("/api/admin/platform-keys", {
        method: "PATCH",
        body: { updates: { [key]: value.trim() } },
      });
      setKeys(res.keys);
      cancelEditing(key);
      setMessage({ type: "success", text: `${key} updated — active immediately` });
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function clearKey(key: string) {
    if (!confirm(`Remove ${key}? This will disable the associated service.`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.fetch<{ keys: PlatformKey[] }>("/api/admin/platform-keys", {
        method: "PATCH",
        body: { updates: { [key]: "" } },
      });
      setKeys(res.keys);
      setMessage({ type: "success", text: `${key} removed` });
    } catch {
      setMessage({ type: "error", text: "Failed to remove" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        Loading...
      </div>
    );
  }

  const grouped = new Map<string, PlatformKey[]>();
  for (const k of keys) {
    if (!grouped.has(k.group)) grouped.set(k.group, []);
    grouped.get(k.group)!.push(k);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn"
            style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "13px", opacity: 0.6, marginBottom: "16px", padding: 0 }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700, margin: 0 }}>
            Platform Keys
          </h1>
          <p style={{ fontFamily: "var(--font-content)", fontSize: "14px", opacity: 0.5, marginTop: "8px" }}>
            Manage API keys and environment variables. Changes take effect immediately.
          </p>
        </div>

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

        {Array.from(grouped.entries()).map(([group, groupKeys]) => (
          <div key={group} style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--steel-blue)", marginBottom: "12px",
              paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)",
            }}>
              {group}
            </h2>

            {groupKeys.map((pk) => (
              <div key={pk.key} style={{
                padding: "14px 0", borderBottom: "1px solid var(--border-subtle)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: "0 0 220px" }}>
                    <div style={{ fontFamily: "var(--font-content)", fontSize: "14px", fontWeight: 600 }}>
                      {pk.label}
                      {pk.required && <span style={{ color: "var(--ruby-red)", marginLeft: "4px" }}>*</span>}
                    </div>
                    <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", opacity: 0.5, marginTop: "3px", lineHeight: 1.4 }}>
                      {pk.description}
                    </div>
                    <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: "10px", opacity: 0.3, marginTop: "4px" }}>
                      {pk.key}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {editing.has(pk.key) ? (
                      <>
                        <input
                          type="text"
                          value={editValues[pk.key] || ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [pk.key]: e.target.value }))}
                          placeholder={pk.placeholder}
                          autoFocus
                          style={{
                            flex: 1, minWidth: "200px", background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                            borderRadius: "6px", padding: "8px 12px", fontFamily: "'Source Code Pro', monospace",
                            fontSize: "13px", color: "var(--text-primary)", outline: "none",
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") saveKey(pk.key); if (e.key === "Escape") cancelEditing(pk.key); }}
                        />
                        <button onClick={() => saveKey(pk.key)} disabled={saving || !editValues[pk.key]?.trim()} className="btn"
                          style={{ background: "#008060", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: saving || !editValues[pk.key]?.trim() ? 0.4 : 1 }}>
                          Save
                        </button>
                        <button onClick={() => cancelEditing(pk.key)} className="btn"
                          style={{ background: "none", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "8px 12px", fontFamily: "var(--font-label)", fontSize: "12px", cursor: "pointer", opacity: 0.6 }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          style={{ flex: 1, fontFamily: "'Source Code Pro', monospace", fontSize: "13px", color: pk.isSet ? "var(--text-primary)" : "var(--ruby-red)", opacity: pk.isSet ? 0.8 : 1 }}
                        >
                          {pk.isSet ? (revealed.has(pk.key) ? pk.value : pk.maskedValue) : "Not set"}
                        </span>
                        {pk.isSet && (
                          <button onClick={() => setRevealed((prev) => { const n = new Set(prev); if (n.has(pk.key)) n.delete(pk.key); else n.add(pk.key); return n; })} className="btn"
                            style={{ background: "none", color: "var(--text-muted)", border: "none", padding: "4px 8px", fontFamily: "var(--font-label)", fontSize: "11px", cursor: "pointer" }}>
                            {revealed.has(pk.key) ? "Hide" : "Show"}
                          </button>
                        )}
                        <button onClick={() => startEditing(pk.key)} className="btn"
                          style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "6px 14px", fontFamily: "var(--font-label)", fontSize: "12px", cursor: "pointer" }}>
                          Edit
                        </button>
                        {pk.isSet && !pk.required && (
                          <button onClick={() => clearKey(pk.key)} className="btn"
                            style={{ background: "none", color: "var(--ruby-red)", border: "1px solid rgba(130,50,60,0.3)", borderRadius: "6px", padding: "6px 12px", fontFamily: "var(--font-label)", fontSize: "12px", cursor: "pointer" }}>
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Add Custom Key */}
        <div style={{ marginBottom: "32px", marginTop: "40px" }}>
          <h2 style={{
            fontFamily: "var(--font-label)", fontSize: "12px", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--steel-blue)", marginBottom: "12px",
            paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)",
          }}>
            Add New Key
          </h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", opacity: 0.6, marginBottom: "4px" }}>Key Name</div>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="MY_CUSTOM_KEY"
                style={{
                  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                  borderRadius: "6px", padding: "8px 12px", fontFamily: "'Source Code Pro', monospace",
                  fontSize: "13px", color: "var(--text-primary)", outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", opacity: 0.6, marginBottom: "4px" }}>Value</div>
              <input
                type="text"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="Enter value"
                style={{
                  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                  borderRadius: "6px", padding: "8px 12px", fontFamily: "'Source Code Pro', monospace",
                  fontSize: "13px", color: "var(--text-primary)", outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newKeyName && newKeyValue) {
                    saveKey(newKeyName);
                  }
                }}
              />
            </div>
            <button
              onClick={async () => {
                if (!newKeyName || !newKeyValue) return;
                setSaving(true);
                setMessage(null);
                try {
                  const res = await api.fetch<{ keys: PlatformKey[] }>("/api/admin/platform-keys", {
                    method: "PATCH",
                    body: { updates: { [newKeyName]: newKeyValue } },
                  });
                  setKeys(res.keys);
                  setNewKeyName("");
                  setNewKeyValue("");
                  setMessage({ type: "success", text: `${newKeyName} added — active immediately` });
                } catch {
                  setMessage({ type: "error", text: "Failed to add key" });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!newKeyName || !newKeyValue || saving}
              className="btn"
              style={{
                background: "#008060", color: "#fff", border: "none", borderRadius: "6px",
                padding: "8px 20px", fontFamily: "var(--font-label)", fontSize: "12px",
                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                opacity: !newKeyName || !newKeyValue || saving ? 0.4 : 1,
              }}
            >
              Add Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
