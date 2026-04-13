import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

type LayoutPreset = "full" | "prototype" | "staging" | "preview";

interface WorkspaceControlPanelProps {
  showArchitect: boolean;
  showBuilder: boolean;
  showRunway: boolean;
  showNotes: boolean;
  runwayAutoSwitch: boolean;
  glassMode: string;
  theme: string;
  showDotGrid: boolean;
  layoutPreset: LayoutPreset;
  onToggleArchitect: () => void;
  onToggleBuilder: () => void;
  onToggleRunway: () => void;
  onToggleNotes: () => void;
  onToggleAutoSwitch: () => void;
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
          color: active ? "rgba(251, 246, 238, 0.9)" : "rgba(251, 246, 238, 0.6)",
          transition: "color 200ms",
        }}
      >
        {label}
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
        marginTop: "16px",
        marginBottom: "8px",
      }}
    >
      {text}
    </div>
  );
}

const PRESETS: { key: LayoutPreset; label: string; color: string }[] = [
  { key: "full",      label: "Full IDE",   color: "rgba(251,246,238,0.5)" },
  { key: "prototype", label: "Prototype",  color: "#043B40" },
  { key: "staging",   label: "Staging",    color: "#520322" },
  { key: "preview",   label: "Preview",    color: "#00203A" },
];

export function WorkspaceControlPanel({
  showArchitect,
  showBuilder,
  showRunway,
  showNotes,
  runwayAutoSwitch,
  glassMode,
  theme,
  showDotGrid,
  layoutPreset,
  onToggleArchitect,
  onToggleBuilder,
  onToggleRunway,
  onToggleNotes,
  onToggleAutoSwitch,
  onToggleGlass,
  onCycleTheme,
  onToggleDotGrid,
  onApplyPreset,
}: WorkspaceControlPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        width: expanded ? "240px" : "40px",
        minWidth: expanded ? "240px" : "40px",
        background: "#0D1117",
        borderLeft: "1px solid rgba(251,246,238,0.15)",
        flexShrink: 0,
        transition: "width 250ms ease, min-width 250ms ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Expand/collapse button */}
      <div
        style={{
          padding: "8px",
          display: "flex",
          justifyContent: expanded ? "flex-end" : "center",
          borderBottom: "1px solid rgba(251,246,238,0.15)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(251,246,238,0.4)",
            padding: "4px",
          }}
        >
          {expanded ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      {/* Scrollable content */}
      {expanded && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 16px 16px",
          }}
        >
          {/* Layout Presets */}
          <GroupHeader text="Layout" />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => onApplyPreset(p.key)}
                className="btn"
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: "12px",
                  padding: "6px 10px",
                  color: layoutPreset === p.key ? p.color : "rgba(251,246,238,0.35)",
                  background: layoutPreset === p.key ? "rgba(251,246,238,0.06)" : "transparent",
                  border: layoutPreset === p.key ? "1px solid rgba(251,246,238,0.15)" : "1px solid transparent",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: layoutPreset === p.key ? 700 : 400,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Group 1: Column Visibility */}
          <GroupHeader text="Columns" />
          <Toggle
            active={showArchitect}
            onToggle={onToggleArchitect}
            label="Architect"
            activeColor="#043B40"
          />
          <Toggle
            active={showBuilder}
            onToggle={onToggleBuilder}
            label="Builder"
            activeColor="#520322"
          />
          <Toggle
            active={showRunway}
            onToggle={onToggleRunway}
            label="Staging Runway"
            activeColor="#00203A"
          />

          {/* Group 2: Display Settings */}
          <GroupHeader text="Display" />
          <Toggle
            active={glassMode === "lab"}
            onToggle={onToggleGlass}
            label="Glass Mode"
            variant="sm"
          />
          <Toggle
            active={theme === "dark"}
            onToggle={onCycleTheme}
            label="Dark Mode"
            variant="sm"
          />
          <Toggle
            active={showDotGrid}
            onToggle={onToggleDotGrid}
            label="Dot Grid"
            variant="sm"
          />

          {/* Group 3: AI Behavior */}
          <GroupHeader text="AI Behavior" />
          <Toggle
            active={runwayAutoSwitch}
            onToggle={onToggleAutoSwitch}
            label="Auto-switch Runway"
            variant="sq"
          />

          {/* Group 4: Workspace */}
          <GroupHeader text="Workspace" />
          <Toggle
            active={showNotes}
            onToggle={onToggleNotes}
            label="Notes Panel"
          />
        </div>
      )}
    </div>
  );
}
