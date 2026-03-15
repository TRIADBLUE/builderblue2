import { useState } from "react";
import { api } from "../../../lib/api";

interface Secret {
  id: string;
  key: string;
}

interface SecretsTabProps {
  projectId: string;
  secrets: Secret[];
  onRefresh: () => void;
}

export function SecretsTab({ projectId, secrets, onRefresh }: SecretsTabProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    await api.fetch(`/api/projects/${projectId}/secrets`, {
      method: "POST",
      body: { key: newKey, value: newValue },
    });
    setNewKey("");
    setNewValue("");
    onRefresh();
  };

  const handleReveal = async (id: string) => {
    try {
      const data = await api.fetch<{ value: string }>(
        `/api/projects/${projectId}/secrets/${id}/reveal`
      );
      setRevealedId(id);
      setRevealedValue(data.value);
      setCountdown(5);

      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setRevealedId(null);
            setRevealedValue("");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      // Secret API may not be implemented yet
    }
  };

  const handleDelete = async (id: string) => {
    await api.fetch(`/api/projects/${projectId}/secrets/${id}`, {
      method: "DELETE",
    });
    onRefresh();
  };

  return (
    <div
      className="flex h-full flex-col p-4"
      style={{ background: "var(--triad-black)" }}
    >
      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "10px",
                color: "var(--cream)",
                opacity: 0.5,
                textTransform: "uppercase",
              }}
            >
              <th className="text-left pb-2">Key</th>
              <th className="text-left pb-2">Value</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {secrets.map((secret) => (
              <tr
                key={secret.id}
                style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "12px",
                  color: "var(--cream)",
                  borderBottom: "1px solid rgba(233, 236, 240, 0.05)",
                }}
              >
                <td className="py-2">{secret.key}</td>
                <td className="py-2">
                  {revealedId === secret.id ? (
                    <span>
                      {revealedValue}{" "}
                      <span style={{ opacity: 0.4, fontSize: "10px" }}>
                        ({countdown}s)
                      </span>
                    </span>
                  ) : (
                    "•••••••"
                  )}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => handleReveal(secret.id)}
                    className="mr-2 text-xs"
                    style={{
                      color: "var(--steel-blue)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(secret.id)}
                    className="text-xs"
                    style={{
                      color: "var(--ruby-red)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {secrets.length === 0 && (
          <div
            className="py-8 text-center"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "13px",
              color: "var(--cream)",
              opacity: 0.3,
            }}
          >
            No secrets configured
          </div>
        )}
      </div>

      {/* Add form */}
      <div
        className="flex items-center gap-2 border-t pt-3"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="KEY_NAME"
          className="flex-1 rounded border bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{
            fontFamily: "var(--font-runway)",
            color: "var(--cream)",
            borderColor: "rgba(233, 236, 240, 0.2)",
          }}
        />
        <input
          type="password"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          className="flex-1 rounded border bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{
            fontFamily: "var(--font-runway)",
            color: "var(--cream)",
            borderColor: "rgba(233, 236, 240, 0.2)",
          }}
        />
        <button
          onClick={handleAdd}
          className="rounded px-3 py-1.5 text-xs"
          style={{
            fontFamily: "var(--font-runway)",
            background: "var(--steel-blue)",
            color: "var(--cream)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
