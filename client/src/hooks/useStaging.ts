import { useState, useCallback } from "react";
import { api } from "../lib/api";
import type { StagedChange } from "@shared/types";

interface UseStagingReturn {
  changes: StagedChange[];
  isLoading: boolean;
  loadChanges: (projectId: string, status?: string) => Promise<void>;
  approveChange: (id: string) => Promise<void>;
  rejectChange: (id: string) => Promise<void>;
  approveAll: (projectId: string) => Promise<void>;
  commitChanges: (projectId: string) => Promise<{ files: string[] }>;
  addChange: (change: StagedChange) => void;
  refreshById: (id: string) => Promise<void>;
}

export function useStaging(): UseStagingReturn {
  const [changes, setChanges] = useState<StagedChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChanges = useCallback(
    async (projectId: string, status?: string) => {
      setIsLoading(true);
      try {
        const url = status
          ? `/api/staging/${projectId}?status=${status}`
          : `/api/staging/${projectId}`;
        const data = await api.fetch<StagedChange[]>(url);
        setChanges(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const approveChange = useCallback(async (id: string) => {
    const updated = await api.fetch<StagedChange>(`/api/staging/${id}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
  }, []);

  const rejectChange = useCallback(async (id: string) => {
    const updated = await api.fetch<StagedChange>(`/api/staging/${id}`, {
      method: "PATCH",
      body: { status: "rejected" },
    });
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
    // Remove after animation
    setTimeout(() => {
      setChanges((prev) => prev.filter((c) => c.id !== id));
    }, 250);
  }, []);

  const approveAll = useCallback(
    async (projectId: string) => {
      const pending = changes.filter((c) => c.status === "pending");
      await Promise.all(
        pending.map((c) =>
          api.fetch(`/api/staging/${c.id}`, {
            method: "PATCH",
            body: { status: "approved" },
          })
        )
      );
      setChanges((prev) =>
        prev.map((c) =>
          c.status === "pending" ? { ...c, status: "approved" as const } : c
        )
      );
    },
    [changes]
  );

  const commitChanges = useCallback(
    async (projectId: string) => {
      const result = await api.fetch<{ files: string[] }>(
        `/api/staging/${projectId}/commit`,
        { method: "POST" }
      );
      setChanges((prev) =>
        prev.map((c) =>
          c.status === "approved"
            ? { ...c, status: "committed" as const }
            : c
        )
      );
      return result;
    },
    []
  );

  const addChange = useCallback((change: StagedChange) => {
    setChanges((prev) => [...prev, change]);
  }, []);

  const refreshById = useCallback(async (id: string) => {
    try {
      const data = await api.fetch<StagedChange>(`/api/staging/${id}`);
      setChanges((prev) => {
        const exists = prev.find((c) => c.id === id);
        if (exists) return prev.map((c) => (c.id === id ? data : c));
        return [...prev, data];
      });
    } catch {
      // ignore
    }
  }, []);

  return {
    changes,
    isLoading,
    loadChanges,
    approveChange,
    rejectChange,
    approveAll,
    commitChanges,
    addChange,
    refreshById,
  };
}
