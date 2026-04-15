interface RunwayToggleProps {
  mode: "architect" | "builder";
  onToggle: (mode: "architect" | "builder") => void;
}

export function RunwayToggle({ mode, onToggle }: RunwayToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "6px",
          borderBottom: "1px solid var(--ide-border)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 12px",
          borderBottom: "1px solid var(--ide-border)",
          gap: "4px",
        }}
      >
        <button
          onClick={() => onToggle("architect")}
          className="btn"
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-label)",
            fontSize: "14px",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            transition: "all 0.2s ease",
            background: mode === "architect" ? "#043B40" : "transparent",
            color: mode === "architect" ? "#E9ECF0" : "var(--ide-text)",
            textShadow: "0.5px 0.5px 0px #E9ECF0",
          }}
        >
          Architect
        </button>

        <button
          onClick={() => onToggle("builder")}
          className="btn"
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-label)",
            fontSize: "14px",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            transition: "all 0.2s ease",
            background: mode === "builder" ? "#520322" : "transparent",
            color: mode === "builder" ? "#E9ECF0" : "var(--ide-text)",
            textShadow: "0.5px 0.5px 0px #E9ECF0",
          }}
        >
          Builder
        </button>
      </div>
    </div>
  );
}
