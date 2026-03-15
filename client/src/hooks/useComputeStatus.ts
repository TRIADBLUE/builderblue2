import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { ComputeStatus, ComputeUsage } from "@shared/types";

interface UseComputeStatusReturn {
  status: ComputeStatus;
  usage: ComputeUsage | null;
  isLoading: boolean;
  refresh: () => void;
}

function computeLevel(
  percentage: number
): ComputeStatus["level"] {
  if (percentage >= 100) return "depleted";
  if (percentage >= 95) return "critical";
  if (percentage >= 80) return "warning";
  return "normal";
}

export function useComputeStatus(): UseComputeStatusReturn {
  const [usage, setUsage] = useState<ComputeUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    api
      .fetch<ComputeUsage>("/api/compute/usage")
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch(() => {
        // No usage record yet — default to 0/0
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const sessionsUsed = usage?.sessionsUsed ?? 0;
  const sessionsAllowed = usage?.sessionsAllowed ?? 1;
  const percentage = sessionsAllowed > 0
    ? Math.round((sessionsUsed / sessionsAllowed) * 100)
    : 0;

  const status: ComputeStatus = {
    sessionsUsed,
    sessionsAllowed,
    percentage,
    level: computeLevel(percentage),
  };

  return { status, usage, isLoading, refresh };
}
