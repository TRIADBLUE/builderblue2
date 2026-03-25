import { useState, useRef, useEffect } from "react";
import type { AIProvider } from "@shared/types";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

interface ProviderInfo {
  id: AIProvider;
  name: string;
  models: ModelInfo[];
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "claude",
    name: "Claude",
    models: [
      { id: "claude-opus-4-20250514", name: "Opus 4.6 (1M context)", description: "Most capable for ambitious work" },
      { id: "claude-sonnet-4-20250514", name: "Sonnet 4", description: "Fast and efficient for everyday tasks" },
      { id: "claude-haiku-4-5-20251001", name: "Haiku 4.5", description: "Fastest for quick answers" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B", description: "Open-source powerhouse" },
      { id: "qwen-qwq-32b", name: "Qwen QwQ 32B", description: "Reasoning specialist" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Ultra-fast lightweight" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", description: "Google's compact model" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", description: "General conversation and planning" },
      { id: "deepseek-coder", name: "DeepSeek Coder", description: "Optimized for code generation" },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast multimodal reasoning" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Long context, deep analysis" },
    ],
  },
  {
    id: "kimi",
    name: "Kimi",
    models: [
      { id: "moonshot-v1-8k", name: "Moonshot v1 8K", description: "Compact and efficient" },
      { id: "moonshot-v1-32k", name: "Moonshot v1 32K", description: "Extended context window" },
    ],
  },
];

interface ModelPickerProps {
  provider: AIProvider;
  model: string;
  panelColor: string;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
}

export function ModelPicker({ provider, model, panelColor, onProviderChange, onModelChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Find current display names
  const currentProvider = PROVIDERS.find((p) => p.id === provider);
  const currentModel = currentProvider?.models.find((m) => m.id === model);
  const displayName = currentModel ? `${currentProvider?.name} ${currentModel.name}` : model;

  const handleSelect = (providerId: AIProvider, modelId: string) => {
    if (providerId !== provider) onProviderChange(providerId);
    onModelChange(modelId);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded transition-all"
        style={{
          fontFamily: "var(--font-runway)",
          fontSize: "11px",
          color: panelColor,
          background: open ? `${panelColor}10` : "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 6px",
        }}
      >
        {displayName}
        <span style={{ fontSize: "8px", opacity: 0.6, marginLeft: "2px" }}>▾</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: "280px",
            maxHeight: "420px",
            overflowY: "auto",
            background: "#FFF5ED",
            border: "1px solid rgba(9,8,14,0.12)",
            borderRadius: "10px",
            boxShadow: "0 16px 48px rgba(9,8,14,0.15), 0 4px 12px rgba(9,8,14,0.08)",
            zIndex: 100,
            padding: "6px 0",
          }}
        >
          {PROVIDERS.map((prov, pi) => (
            <div key={prov.id}>
              {pi > 0 && (
                <div style={{ height: "1px", background: "rgba(9,8,14,0.06)", margin: "4px 12px" }} />
              )}
              {/* Provider header */}
              <div
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--steel-blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "8px 14px 4px",
                }}
              >
                {prov.name}
              </div>
              {/* Models */}
              {prov.models.map((m) => {
                const isSelected = prov.id === provider && m.id === model;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(prov.id, m.id)}
                    className="w-full text-left transition-all"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "6px 14px",
                      background: isSelected ? `${panelColor}08` : "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderLeft: isSelected ? `2px solid ${panelColor}` : "2px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = isSelected ? `${panelColor}08` : "transparent";
                    }}
                  >
                    {/* Checkmark */}
                    <span
                      style={{
                        width: "16px",
                        flexShrink: 0,
                        fontFamily: "var(--font-runway)",
                        fontSize: "12px",
                        color: panelColor,
                        fontWeight: 700,
                        marginTop: "1px",
                      }}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-runway)",
                          fontSize: "12px",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? panelColor : "#09080E",
                          lineHeight: 1.3,
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-content)",
                          fontSize: "10px",
                          color: "var(--steel-blue)",
                          lineHeight: 1.3,
                          marginTop: "1px",
                        }}
                      >
                        {m.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
