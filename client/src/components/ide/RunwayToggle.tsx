interface RunwayToggleProps {
  mode: "architect" | "builder";
  onToggle: (mode: "architect" | "builder") => void;
}

export function RunwayToggle({ mode, onToggle }: RunwayToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 12px",
        borderBottom: "2px solid rgba(251, 246, 238, 0.75)",
        background: "inherit",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          borderRadius: "8px",
          border: "2px solid rgba(251, 246, 238, 0.3)",
          overflow: "hidden",
          cursor: "pointer",
          userSelect: "none",
          width: "320px",
          height: "44px",
        }}
      >
        {/* Sliding pill indicator */}
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: mode === "architect" ? "2px" : "calc(50% + 2px)",
            width: "calc(50% - 4px)",
            height: "38px",
            borderRadius: "6px",
            background: mode === "architect" ? "#043B40" : "#520322",
            transition: "left 0.25s ease, background 0.25s ease",
          }}
        />

        {/* Architect side */}
        <div
          onClick={() => onToggle("architect")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            fontFamily: "var(--font-label)",
            fontSize: "16px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: mode === "architect" ? "#E9ECF0" : "rgba(251, 246, 238, 0.55)",
            fontWeight: mode === "architect" ? 700 : 500,
            transition: "color 0.2s ease",
          }}
        >
          Architect
        </div>

        {/* Builder side */}
        <div
          onClick={() => onToggle("builder")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            fontFamily: "var(--font-label)",
            fontSize: "16px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: mode === "builder" ? "#E9ECF0" : "rgba(251, 246, 238, 0.55)",
            fontWeight: mode === "builder" ? 700 : 500,
            transition: "color 0.2s ease",
          }}
        >
          Builder
        </div>
      </div>
    </div>
  );
}
