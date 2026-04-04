import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface UsageLineItem {
  id: string;
  provider: string;
  model: string;
  role: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: string;
  createdAt: string;
}

interface ProjectUsage {
  items: UsageLineItem[];
  totalCost: string;
  itemCount: number;
}

interface ComputeTabProps {
  projectId: string;
}

const ROLE_COLORS: Record<string, string> = {
  architect: "#043B40",
  builder: "#520322",
  unknown: "#00203A",
};

const ROLE_LABELS: Record<string, string> = {
  architect: "Architect",
  builder: "Builder",
  unknown: "System",
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatModel(model: string): string {
  if (model.includes("opus")) return "Opus";
  if (model.includes("sonnet")) return "Sonnet";
  if (model.includes("haiku")) return "Haiku";
  if (model.includes("deepseek-chat")) return "DeepSeek";
  if (model.includes("deepseek-coder")) return "DS Coder";
  if (model.includes("gemini")) return "Gemini";
  if (model.includes("llama")) return "Llama";
  if (model.includes("moonshot")) return "Moonshot";
  if (model.includes("qwen")) return "Qwen";
  return model.slice(0, 15);
}

export function ComputeTab({ projectId }: ComputeTabProps) {
  const [usage, setUsage] = useState<ProjectUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<ProjectUsage>(`/api/billing/project-usage/${projectId}`);
        setUsage(data);
      } catch {
        setUsage(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2" style={{ borderColor: "#00203A" }} />
      </div>
    );
  }

  if (!usage || usage.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ opacity: 0.3 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "#09080E", marginBottom: "4px" }}>
            No compute used yet
          </div>
          <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "#09080E" }}>
            Costs will appear here as the Architect and Builder work.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ overflow: "hidden" }}>
      {/* Total cost header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(9,8,14,0.08)", flexShrink: 0 }}
      >
        <span style={{ fontFamily: "var(--font-label)", fontSize: "10px", fontWeight: 700, color: "#00203A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Compute Cost
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: "#09080E" }}>
          ${usage.totalCost}
        </span>
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto">
        {usage.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center px-4 py-2"
            style={{ borderBottom: "1px solid rgba(9,8,14,0.04)" }}
          >
            <div
              style={{
                width: "3px",
                height: "24px",
                borderRadius: "2px",
                background: ROLE_COLORS[item.role] ?? "#09080E",
                marginRight: "10px",
                flexShrink: 0,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "var(--font-label)",
                  fontSize: "9px",
                  fontWeight: 600,
                  color: ROLE_COLORS[item.role] ?? "#09080E",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  {ROLE_LABELS[item.role] ?? "System"}
                </span>
                <span style={{
                  fontFamily: "var(--font-content)",
                  fontSize: "10px",
                  color: "rgba(9,8,14,0.4)",
                }}>
                  {formatModel(item.model)}
                </span>
              </div>
              <div style={{
                fontFamily: "var(--font-content)",
                fontSize: "9px",
                color: "rgba(9,8,14,0.3)",
                marginTop: "1px",
              }}>
                {item.inputTokens.toLocaleString()} in · {item.outputTokens.toLocaleString()} out · {formatTime(item.createdAt)}
              </div>
            </div>
            <span style={{
              fontFamily: "var(--font-label)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#09080E",
              flexShrink: 0,
            }}>
              ${parseFloat(item.costUsd).toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
