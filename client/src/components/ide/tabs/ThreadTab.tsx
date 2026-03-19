import { useState, useEffect, useRef } from "react";
import { api } from "../../../lib/api";

interface ThreadEntry {
  id: string;
  role: "architect" | "builder" | "user" | "system";
  action: "message" | "handoff" | "staged" | "review" | "approved" | "rejected" | "committed";
  content: string;
  filePath?: string;
  timestamp: string;
}

interface ThreadTabProps {
  projectId: string;
}

const ROLE_EMOJI: Record<string, string> = {
  architect: "🧩",
  builder: "⚡",
  user: "👤",
  system: "⚙️",
};

const ACTION_EMOJI: Record<string, string> = {
  message: "💬",
  handoff: "📋",
  staged: "📦",
  review: "🔎",
  approved: "✅",
  rejected: "❌",
  committed: "🚀",
};

const ROLE_COLORS: Record<string, string> = {
  architect: "var(--steel-blue)",
  builder: "var(--deep-blue)",
  user: "var(--cream)",
  system: "#D4A843",
};

export function ThreadTab({ projectId }: ThreadTabProps) {
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<ThreadEntry[]>(`/api/thread/${projectId}`);
        setEntries(data);
      } catch {
        // Thread endpoint may not exist yet — show empty
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // Poll for updates
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: "var(--cream)" }} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(233, 236, 240, 0.1)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "12px",
            color: "var(--cream)",
            fontWeight: 600,
          }}
        >
          🧵 Construction Thread
        </span>
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "10px",
            color: "var(--cream)",
            opacity: 0.4,
          }}
        >
          {entries.length} entries
        </span>
      </div>

      {/* Thread entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entries.length === 0 ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-2"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: "32px" }}>🧵</span>
            <span
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "13px",
                color: "var(--cream)",
              }}
            >
              Conversation thread will appear here
            </span>
            <span
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: "var(--cream)",
                opacity: 0.6,
              }}
            >
              Architect plans, Builder codes, you approve
            </span>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md px-3 py-2"
              style={{
                background: "rgba(233, 236, 240, 0.05)",
                borderLeft: `2px solid ${ROLE_COLORS[entry.role] ?? "var(--steel-blue)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: "12px" }}>
                    {ROLE_EMOJI[entry.role]} {ACTION_EMOJI[entry.action]}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-runway)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: ROLE_COLORS[entry.role],
                      textTransform: "capitalize",
                    }}
                  >
                    {entry.role}
                  </span>
                  {entry.filePath && (
                    <span
                      className="rounded px-1 py-0.5"
                      style={{
                        fontFamily: "var(--font-runway)",
                        fontSize: "9px",
                        color: "var(--cream)",
                        background: "rgba(74, 144, 217, 0.2)",
                      }}
                    >
                      {entry.filePath}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-runway)",
                    fontSize: "9px",
                    color: "var(--cream)",
                    opacity: 0.3,
                  }}
                >
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "12px",
                  color: "var(--cream)",
                  opacity: 0.8,
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {entry.content.length > 200 ? entry.content.slice(0, 200) + "..." : entry.content}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
