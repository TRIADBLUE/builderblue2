import { useState } from "react";
import { PanelRightClose, Settings, ChevronDown } from "lucide-react";

type LayoutPreset = "full" | "prototype" | "staging" | "preview";

interface WorkspaceControlPanelProps {
  showArchitect: boolean;
  showBuilder: boolean;
  showRunway: boolean;
  showNotes: boolean;
  glassMode: string;
  theme: string;
  showDotGrid: boolean;
  layoutPreset: LayoutPreset;
  onToggleArchitect: () => void;
  onToggleBuilder: () => void;
  onToggleRunway: () => void;
  onToggleNotes: () => void;
  onToggleGlass: () => void;
  onCycleTheme: () => void;
  onToggleDotGrid: () => void;
  onApplyPreset: (preset: LayoutPreset) => void;
}

interface ToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  variant?: "pill" | "sm" | "sq";
  activeColor?: string;
}

function Toggle({ active, onToggle, label, variant = "pill", activeColor }: ToggleProps) {
  const cls = `workspace-toggle${variant !== "pill" ? ` ${variant}` : ""}${active ? " active" : ""}`;
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "5px 0" }}
    >
      <span
        style={{
          fontFamily: "'Source Sans 3', sans-serif",
          fontSize: "12px",
          color: active ? "rgba(251, 246, 238, 0.9)" : "rgba(251, 246, 238, 0.5)",
          transition: "color 200ms",
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: active ? "#00FF41" : "rgba(251,246,238,0.25)",
            transition: "color 200ms",
          }}
        >
          {active ? "ON" : "OFF"}
        </span>
        <div
          className={cls}
          onClick={onToggle}
        >
          <div
            className="track"
            style={activeColor && active ? { background: activeColor } as React.CSSProperties : undefined}
          >
            <div className="knob" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupHeader({ text }: { text: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-label)",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "rgba(251, 246, 238, 0.3)",
        marginTop: "20px",
        marginBottom: "8px",
        borderBottom: "1px solid rgba(251,246,238,0.06)",
        paddingBottom: "4px",
      }}
    >
      {text}
    </div>
  );
}

const PRESETS: { key: LayoutPreset; label: string; desc: string; color: string }[] = [
  { key: "full",      label: "Full IDE",  desc: "All 3 columns",          color: "rgba(251,246,238,0.7)" },
  { key: "prototype", label: "Prototype", desc: "Architect + Runway",     color: "#043B40" },
  { key: "staging",   label: "Staging",   desc: "Builder + Runway",       color: "#520322" },
  { key: "preview",   label: "Preview",   desc: "Runway only",            color: "#00203A" },
];

export function WorkspaceControlPanel({
  showArchitect,
  showBuilder,
  showRunway,
  showNotes,
  glassMode,
  theme,
  showDotGrid,
  layoutPreset,
  onToggleArchitect,
  onToggleBuilder,
  onToggleRunway,
  onToggleNotes,
  onToggleGlass,
  onCycleTheme,
  onToggleDotGrid,
  onApplyPreset,
}: WorkspaceControlPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const currentPreset = PRESETS.find((p) => p.key === layoutPreset) ?? PRESETS[0];

  if (!expanded) {
    return (
      <div
        style={{
          width: "40px",
          minWidth: "40px",
          background: "#0D1117",
          borderLeft: "1px solid rgba(251,246,238,0.15)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "12px",
          height: "100%",
        }}
      >
        <button
          onClick={() => setExpanded(true)}
          className="btn"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(251,246,238,0.4)",
            padding: "6px",
          }}
          title="Open Workspace Controls"
        >
          <Settings size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "240px",
        minWidth: "240px",
        background: "#0D1117",
        borderLeft: "1px solid rgba(251,246,238,0.15)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(251,246,238,0.15)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(251,246,238,0.6)",
          }}
        >
          Panel
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="btn"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(251,246,238,0.4)",
            padding: "2px",
          }}
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 14px 16px",
        }}
      >
        {/* Runway Choices — first thing you see */}
        <div style={{ marginTop: "8px", marginBottom: "16px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#FBF6EE",
            marginBottom: "10px",
            textAlign: "center",
          }}>
            Runways
          </div>
          {([
            { label: "Architect", color: "#043B40", active: showArchitect, toggle: onToggleArchitect },
            { label: "Builder",   color: "#520322", active: showBuilder,   toggle: onToggleBuilder },
            { label: "Staging",   color: "#00203A", active: showRunway,    toggle: onToggleRunway },
          ]).map((r) => (
            <button
              key={r.label}
              onClick={r.toggle}
              className="btn"
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                marginBottom: "4px",
                fontFamily: "var(--font-label)",
                fontSize: "13px",
                fontWeight: r.active ? 700 : 400,
                color: r.active ? "#FBF6EE" : "rgba(251,246,238,0.3)",
                background: r.active ? r.color : "transparent",
                border: r.active ? "none" : "1px solid rgba(251,246,238,0.1)",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 150ms",
              }}
            >
              {r.active ? "● " : "○ "}{r.label}
            </button>
          ))}
        </div>

        {/* Layout Selector — dropdown style */}
        <GroupHeader text="Layout" />
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setLayoutOpen(!layoutOpen)}
            className="btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "rgba(251,246,238,0.04)",
              border: "1px solid rgba(251,246,238,0.15)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 150ms",
            }}
          >
            <div>
              <div style={{
                fontFamily: "var(--font-label)",
                fontSize: "13px",
                fontWeight: 700,
                color: currentPreset.color,
                textAlign: "left",
              }}>
                {currentPreset.label}
              </div>
              <div style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "10px",
                color: "rgba(251,246,238,0.4)",
                textAlign: "left",
                marginTop: "2px",
              }}>
                {currentPreset.desc}
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: "rgba(251,246,238,0.4)",
                transform: layoutOpen ? "rotate(180deg)" : "none",
                transition: "transform 200ms",
              }}
            />
          </button>

          {layoutOpen && (
            <div
              style={{
                marginTop: "4px",
                background: "#161B26",
                border: "1px solid rgba(251,246,238,0.12)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => { onApplyPreset(p.key); setLayoutOpen(false); }}
                  className="btn"
                  style={{
                    width: "100%",
                    display: "block",
                    padding: "8px 12px",
                    background: layoutPreset === p.key ? "rgba(251,246,238,0.06)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(251,246,238,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,246,238,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = layoutPreset === p.key ? "rgba(251,246,238,0.06)" : "transparent"; }}
                >
                  <div style={{
                    fontFamily: "var(--font-label)",
                    fontSize: "12px",
                    fontWeight: layoutPreset === p.key ? 700 : 400,
                    color: layoutPreset === p.key ? p.color : "rgba(251,246,238,0.6)",
                  }}>
                    {layoutPreset === p.key ? "● " : ""}{p.label}
                  </div>
                  <div style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "10px",
                    color: "rgba(251,246,238,0.3)",
                    marginTop: "1px",
                  }}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display Settings */}
        <GroupHeader text="Display" />
        <Toggle active={glassMode === "lab"} onToggle={onToggleGlass} label="Glass Mode" variant="sm" />
        <Toggle active={theme === "dark"} onToggle={onCycleTheme} label="Dark Mode" variant="sm" />
        <Toggle active={showDotGrid} onToggle={onToggleDotGrid} label="Dot Grid" variant="sm" />

        {/* Workspace */}
        <GroupHeader text="Workspace" />
        <Toggle active={showNotes} onToggle={onToggleNotes} label="Notes Panel" />
      </div>
    </div>
  );
}
