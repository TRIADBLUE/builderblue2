import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface UsageData {
  plan: string;
  planStatus: string;
  sessionsUsed: number;
  sessionsFromPlan: number;
  sessionsFromBlocks: number;
  sessionsTotal: number;
  sessionsRemaining: number;
  periodStart: string | null;
  periodEnd: string | null;
  consecutiveBlockMonths: number;
}

export function ComputeUsageMeter() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<UsageData>("/api/billing/usage");
        setUsage(data);
      } catch {
        // ignore — user may not have billing set up
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return null;
  if (!usage) return null;

  const percentage =
    usage.sessionsTotal > 0
      ? Math.min(100, (usage.sessionsUsed / usage.sessionsTotal) * 100)
      : 0;
  const isLow = percentage > 80;

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "white",
        border: "1px solid rgba(74, 144, 217, 0.2)",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "13px",
            fontWeight: "bold",
            color: "var(--triad-black)",
          }}
        >
          Compute Usage
        </span>
        <span
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "11px",
            color: "var(--steel-blue)",
            textTransform: "uppercase",
          }}
        >
          {usage.plan === "free" ? "Free Tier" : usage.plan}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-2 overflow-hidden rounded-full"
        style={{ height: "8px", background: "rgba(74, 144, 217, 0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            background: isLow
              ? "var(--tangerine, #E8833A)"
              : "var(--deep-blue)",
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "12px",
            color: isLow ? "var(--tangerine, #E8833A)" : "var(--steel-blue)",
          }}
        >
          {usage.sessionsUsed} / {usage.sessionsTotal} sessions
        </span>
        <span
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "11px",
            color: "var(--steel-blue)",
            opacity: 0.6,
          }}
        >
          {usage.sessionsRemaining} remaining
        </span>
      </div>

      {usage.sessionsFromBlocks > 0 && (
        <div
          className="mt-2 pt-2"
          style={{ borderTop: "1px solid rgba(74, 144, 217, 0.1)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-content)",
              fontSize: "11px",
              color: "var(--steel-blue)",
              opacity: 0.6,
            }}
          >
            {usage.sessionsFromPlan} from plan + {usage.sessionsFromBlocks} from
            blocks
          </span>
        </div>
      )}

      {usage.periodEnd && (
        <div className="mt-1">
          <span
            style={{
              fontFamily: "var(--font-content)",
              fontSize: "10px",
              color: "var(--steel-blue)",
              opacity: 0.4,
            }}
          >
            Resets {new Date(usage.periodEnd).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
