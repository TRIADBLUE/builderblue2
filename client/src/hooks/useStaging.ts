import { useState, useCallback, useRef } from "react";
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
  retryReview: (id: string) => Promise<void>;
}

export function useStaging(): UseStagingReturn {
  const [changes, setChanges] = useState<StagedChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Poll for architect review completion
  const pollTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startPollingForReview = useCallback((id: string, projectId: string) => {
    // Don't double-poll
    if (pollTimers.current.has(id)) return;

    const timer = setInterval(async () => {
      try {
        // Reload all changes to get updated review status
        const data = await api.fetch<StagedChange[]>(`/api/staging/${projectId}`);
        setChanges(data);

        // Check if this specific change is done reviewing
        const change = data.find((c) => c.id === id);
        if (change && change.architectReview !== "reviewing") {
          clearInterval(timer);
          pollTimers.current.delete(id);
        }
      } catch {
        clearInterval(timer);
        pollTimers.current.delete(id);
      }
    }, 2000); // Poll every 2 seconds

    pollTimers.current.set(id, timer);
  }, []);

  const loadChanges = useCallback(
    async (projectId: string, status?: string) => {
      setIsLoading(true);
      try {
        const url = status
          ? `/api/staging/${projectId}?status=${status}`
          : `/api/staging/${projectId}`;
        const data = await api.fetch<StagedChange[]>(url);
        setChanges(data);

        // Start polling for any changes still under review
        data
          .filter((c) => c.architectReview === "reviewing")
          .forEach((c) => startPollingForReview(c.id, projectId));
      } finally {
        setIsLoading(false);
      }
    },
    [startPollingForReview]
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
      // Only approve changes that the architect has approved
      const readyForApproval = changes.filter(
        (c) => c.status === "pending" && c.architectReview === "approved"
      );
      await Promise.all(
        readyForApproval.map((c) =>
          api.fetch(`/api/staging/${c.id}`, {
            method: "PATCH",
            body: { status: "approved" },
          })
        )
      );
      setChanges((prev) =>
        prev.map((c) =>
          c.status === "pending" && c.architectReview === "approved"
            ? { ...c, status: "approved" as const }
            : c
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

  const addChange = useCallback(
    (change: StagedChange) => {
      setChanges((prev) => [...prev, change]);
      // Start polling if it's under review
      if (change.architectReview === "reviewing") {
        startPollingForReview(change.id, change.projectId);
      }
    },
    [startPollingForReview]
  );

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

  const retryReview = useCallback(async (id: string) => {
    await api.fetch(`/api/staging/${id}/retry-review`, {
      method: "POST",
    });
    // Update local state to show reviewing
    setChanges((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              architectReview: "reviewing" as const,
              architectReviewNote: null,
              status: "pending_review" as const,
            }
          : c
      )
    );
    // Start polling for result
    const change = changes.find((c) => c.id === id);
    if (change) {
      startPollingForReview(id, change.projectId);
    }
  }, [changes, startPollingForReview]);

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
    retryReview,
  };
}
