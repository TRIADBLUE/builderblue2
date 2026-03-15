import type { ComputeStatus } from "@shared/types";

interface ComputeWarningBannerProps {
  status: ComputeStatus;
}

export function ComputeWarningBanner({ status }: ComputeWarningBannerProps) {
  if (status.level === "normal" || status.level === "depleted") return null;

  const remaining = status.sessionsAllowed - status.sessionsUsed;
  const isRed = status.level === "critical";

  return (
    <div
      className="compute-warning-enter flex items-center justify-center gap-3 px-4 py-2"
      style={{
        background: isRed ? "var(--ruby-red)" : "#B8860B",
        fontFamily: "var(--font-builder)",
        fontSize: "12px",
        color: "var(--cream)",
      }}
    >
      <span>
        {isRed
          ? "Almost out"
          : `${remaining} session${remaining !== 1 ? "s" : ""} remaining this month`}
      </span>
      <button
        className="rounded px-2 py-0.5 text-xs font-medium"
        style={{
          background: "rgba(233, 236, 240, 0.2)",
          color: "var(--cream)",
          border: "1px solid rgba(233, 236, 240, 0.3)",
        }}
      >
        Add compute
      </button>
      <button
        className="rounded px-2 py-0.5 text-xs font-medium"
        style={{
          background: "rgba(233, 236, 240, 0.2)",
          color: "var(--cream)",
          border: "1px solid rgba(233, 236, 240, 0.3)",
        }}
      >
        Upgrade plan
      </button>
    </div>
  );
}
