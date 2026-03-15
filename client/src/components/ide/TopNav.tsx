import type { ComputeStatus } from "@shared/types";

interface TopNavProps {
  projectName: string;
  branch: string;
  lastSaved: string | null;
  computeStatus: ComputeStatus;
  userName: string;
  onProjectNameChange: (name: string) => void;
  onDeploy: () => void;
}

export function TopNav({
  projectName,
  branch,
  lastSaved,
  computeStatus,
  userName,
  onProjectNameChange,
  onDeploy,
}: TopNavProps) {
  const computeColor =
    computeStatus.level === "normal"
      ? "#008060"
      : computeStatus.level === "warning"
        ? "#B8860B"
        : "var(--ruby-red)";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav
      className="flex h-12 items-center justify-between px-4"
      style={{
        background: "var(--triad-black)",
        borderBottom: "1px solid rgba(233, 236, 240, 0.1)",
      }}
    >
      {/* Left — brand */}
      <div className="flex items-center">
        <img
          src="/builderblue2_url.png"
          alt="BuilderBlue²"
          className="h-7"
          style={{ height: "28px" }}
        />
      </div>

      {/* Center — project info */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="border-none bg-transparent text-center outline-none"
          style={{
            fontFamily: "var(--font-architect)",
            fontSize: "14px",
            color: "var(--cream)",
            width: `${Math.max(projectName.length, 8) * 9}px`,
          }}
        />
        <span
          className="rounded-full px-2 py-0.5"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--cream)",
            background: "var(--steel-blue)",
          }}
        >
          {branch}
        </span>
        {lastSaved && (
          <span
            style={{
              fontFamily: "var(--font-builder)",
              fontSize: "11px",
              color: "var(--cream)",
              opacity: 0.4,
            }}
          >
            Saved {lastSaved}
          </span>
        )}
      </div>

      {/* Right — compute, deploy, avatar */}
      <div className="flex items-center gap-3">
        <span
          className="rounded-full px-2.5 py-1"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--cream)",
            border: `1px solid ${computeColor}`,
          }}
        >
          <span style={{ color: computeColor, fontWeight: 600 }}>
            {computeStatus.sessionsUsed}
          </span>{" "}
          / {computeStatus.sessionsAllowed} sessions
        </span>

        <button
          onClick={onDeploy}
          className="rounded px-3 py-1.5 text-xs font-bold transition-colors"
          style={{
            fontFamily: "var(--font-builder)",
            fontSize: "13px",
            background: "var(--pure-blue)",
            color: "var(--cream)",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Deploy
        </button>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: "var(--steel-blue)",
            fontFamily: "var(--font-builder)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--cream)",
          }}
        >
          {initials}
        </div>
      </div>
    </nav>
  );
}
