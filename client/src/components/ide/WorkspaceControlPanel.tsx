import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface WorkspaceControlPanelProps {
  showArchitect: boolean;
  showBuilder: boolean;
  showRunway: boolean;
  showNotes: boolean;
  runwayAutoSwitch: boolean;
  glassMode: string;
  theme: string;
  showDotGrid: boolean;
  onToggleArchitect: () => void;
  onToggleBuilder: () => void;
  onToggleRunway: () => void;
  onToggleNotes: () => void;
  onToggleAutoSwitch: () => void;
  onToggleGlass: () => void;
  onCycleTheme: () => void;
  onToggleDotGrid: () => void;
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
      style={{ padding: "4px 0" }}
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

export function WorkspaceControlPanel({
  showArchitect,
  showBuilder,
  showRunway,
  showNotes,
  runwayAutoSwitch,
  glassMode,
  theme,
  showDotGrid,
  onToggleArchitect,
  onToggleBuilder,
  onToggleRunway,
  onToggleNotes,
  onToggleAutoSwitch,
  onToggleGlass,
  onCycleTheme,
  onToggleDotGrid,
}: WorkspaceControlPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        width: expanded ? "240px" : "40px",
        background: "#0D1117",
        borderLeft: "1px solid rgba(180,180,195,0.15)",
        flexShrink: 0,
        transition: "width 250ms ease",
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
          borderBottom: "1px solid rgba(251,246,238,0.06)",
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

      {/* Scrollable content — only visible when expanded */}
      {expanded && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 16px 16px",
          }}
        >
          {/* Group 1: Column Visibility — pill toggles */}
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

          {/* Group 2: Display Settings — small toggles */}
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

          {/* Group 3: AI Behavior — square toggles */}
          <GroupHeader text="AI Behavior" />
          <Toggle
            active={runwayAutoSwitch}
            onToggle={onToggleAutoSwitch}
            label="Auto-switch Runway"
            variant="sq"
          />

          {/* Group 4: Workspace — pill toggles */}
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
