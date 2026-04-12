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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function modelName(model: string): string {
  const names: Record<string, string> = {
    "claude-opus-4-20250514": "Claude Opus 4.6",
    "claude-sonnet-4-20250514": "Claude Sonnet 4",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
    "llama-3.1-70b-versatile": "Llama 3.1 70B",
    "qwen-qwq-32b": "Qwen QwQ 32B",
    "llama-3.1-8b-instant": "Llama 3.1 8B",
    "gemma2-9b-it": "Gemma 2 9B",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-coder": "DeepSeek Coder",
    "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "moonshot-v1-8k": "Moonshot 8K",
    "moonshot-v1-32k": "Moonshot 32K",
  };
  return names[model] || model;
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

  const architectCost = usage?.items
    .filter((i) => i.role === "architect")
    .reduce((sum, i) => sum + parseFloat(i.costUsd), 0) ?? 0;
  const builderCost = usage?.items
    .filter((i) => i.role === "builder")
    .reduce((sum, i) => sum + parseFloat(i.costUsd), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "var(--triad-black)" }}>
        <div className="h-5 w-5 animate-spin rounded-full border-b-2" style={{ borderColor: "#00FF41" }} />
      </div>
    );
  }

  if (!usage || usage.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "var(--triad-black)" }}>
        <div style={{ textAlign: "center", opacity: 0.5 }}>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: "14px", color: "#00FF41", marginBottom: "4px" }}>
            No compute used yet
          </div>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: "12px", color: "#00FF41" }}>
            Costs will appear here as the Architect and Builder work.
          </div>
        </div>
      </div>
    );
  }

  const sortedItems = [...usage.items].reverse();

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--triad-black)", overflow: "hidden" }}>
      {/* Running total */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: "1px solid rgba(0, 255, 65, 0.15)", flexShrink: 0 }}
      >
        <div style={{
          fontFamily: "'Source Code Pro', monospace",
          fontSize: "10px",
          color: "#00FF41",
          opacity: 0.5,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "4px",
        }}>
          Session Cost
        </div>
        <div style={{
          fontFamily: "'Allerta Stencil', sans-serif",
          fontSize: "28px",
          color: "#00FF41",
          lineHeight: 1,
          marginBottom: "8px",
        }}>
          ${usage.totalCost}
        </div>
        <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: "11px" }}>
          <span style={{ color: "#043B40" }}>Architect: ${architectCost.toFixed(4)}</span>
          <span style={{ color: "rgba(0, 255, 65, 0.3)", margin: "0 8px" }}>|</span>
          <span style={{ color: "#520322" }}>Builder: ${builderCost.toFixed(4)}</span>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-4 py-1.5"
        style={{
          borderBottom: "1px solid rgba(0, 255, 65, 0.08)",
          flexShrink: 0,
          fontFamily: "'Source Code Pro', monospace",
          fontSize: "9px",
          color: "#00FF41",
          opacity: 0.4,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <span style={{ width: "60px" }}>Time</span>
        <span style={{ width: "70px" }}>Role</span>
        <span style={{ flex: 1 }}>Model</span>
        <span style={{ width: "65px", textAlign: "right" }}>In</span>
        <span style={{ width: "65px", textAlign: "right" }}>Out</span>
        <span style={{ width: "65px", textAlign: "right" }}>Cost</span>
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center px-4 py-1.5"
            style={{ borderBottom: "1px solid rgba(0, 255, 65, 0.04)" }}
          >
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "10px",
              color: "#00FF41",
              opacity: 0.5,
              width: "60px",
              flexShrink: 0,
            }}>
              {timeAgo(item.createdAt)}
            </span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "10px",
              fontWeight: 600,
              color: ROLE_COLORS[item.role] ?? "#00FF41",
              width: "70px",
              flexShrink: 0,
              textTransform: "uppercase",
            }}>
              {item.role === "architect" ? "Arch" : item.role === "builder" ? "Build" : "Sys"}
            </span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "10px",
              color: "#00FF41",
              opacity: 0.7,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {modelName(item.model)}
            </span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "10px",
              color: "#00FF41",
              opacity: 0.6,
              width: "65px",
              textAlign: "right",
              flexShrink: 0,
            }}>
              {item.inputTokens.toLocaleString()}
            </span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "10px",
              color: "#00FF41",
              opacity: 0.6,
              width: "65px",
              textAlign: "right",
              flexShrink: 0,
            }}>
              {item.outputTokens.toLocaleString()}
            </span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "11px",
              fontWeight: 600,
              color: "#00FF41",
              width: "65px",
              textAlign: "right",
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
