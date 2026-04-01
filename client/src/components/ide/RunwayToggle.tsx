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
        padding: "6px 12px",
        borderBottom: "1px solid rgba(9, 8, 14, 0.06)",
        background: "inherit",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          borderRadius: "20px",
          border: "1px solid rgba(9, 8, 14, 0.12)",
          overflow: "hidden",
          cursor: "pointer",
          userSelect: "none",
          width: "220px",
          height: "26px",
        }}
      >
        {/* Sliding pill indicator */}
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: mode === "architect" ? "1px" : "calc(50% + 1px)",
            width: "calc(50% - 2px)",
            height: "22px",
            borderRadius: "18px",
            background: mode === "architect" ? "#3E806B" : "#82323C",
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
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: mode === "architect" ? "#E9ECF0" : "rgba(9, 8, 14, 0.4)",
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
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: mode === "builder" ? "#E9ECF0" : "rgba(9, 8, 14, 0.4)",
            transition: "color 0.2s ease",
          }}
        >
          Builder
        </div>
      </div>
    </div>
  );
}
