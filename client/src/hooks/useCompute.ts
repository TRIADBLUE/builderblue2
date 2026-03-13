import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { ComputeUsage } from "@shared/types";

interface UseComputeReturn {
  usage: ComputeUsage | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCompute(): UseComputeReturn {
  const [usage, setUsage] = useState<ComputeUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api
      .fetch<ComputeUsage>("/api/compute/usage")
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { usage, isLoading, error, refresh };
}
