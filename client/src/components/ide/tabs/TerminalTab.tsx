interface TerminalTabProps {
  projectId: string;
  projectName: string;
}

export function TerminalTab({ projectId, projectName }: TerminalTabProps) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--triad-black)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-3 py-1.5"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--cream)",
            opacity: 0.6,
          }}
        >
          {projectName}
        </span>
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--cream)",
            opacity: 0.3,
          }}
        >
          ~/projects/{projectId.slice(0, 8)}
        </span>
      </div>

      {/* Terminal area */}
      <div className="flex-1 overflow-y-auto p-3">
        <div
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "13px",
            color: "var(--cream)",
          }}
        >
          <div style={{ opacity: 0.5 }}>
            BuilderBlue² Terminal — WebSocket connection ready
          </div>
          <div style={{ opacity: 0.3, marginTop: "4px" }}>
            Terminal sessions require xterm.js + node-pty integration.
          </div>
          <div style={{ opacity: 0.3 }}>
            Connect via ws://localhost:3000/api/ide/terminal/{projectId}
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span style={{ color: "#008060" }}>$</span>
            <span
              className="streaming-cursor streaming-cursor-architect"
              style={{ height: "14px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
