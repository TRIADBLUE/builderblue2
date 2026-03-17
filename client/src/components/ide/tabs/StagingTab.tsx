import { useState } from "react";
import type { StagedChange } from "@shared/types";
import { StagedChangeCard } from "../StagedChangeCard";

interface StagingTabProps {
  changes: StagedChange[];
  newIds: Set<string>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll: () => void;
  onCommit: (message: string) => void;
  onRetryReview?: (id: string) => void;
}

export function StagingTab({
  changes,
  newIds,
  onApprove,
  onReject,
  onApproveAll,
  onCommit,
  onRetryReview,
}: StagingTabProps) {
  const [commitMessage, setCommitMessage] = useState("");

  const reviewingCount = changes.filter(
    (c) => c.status === "pending_review" || c.architectReview === "reviewing"
  ).length;
  const pendingCount = changes.filter(
    (c) => c.status === "pending" && c.architectReview === "approved"
  ).length;
  const rejectedByArchitectCount = changes.filter(
    (c) => c.architectReview === "rejected" && c.status !== "committed"
  ).length;
  const approvedCount = changes.filter((c) => c.status === "approved").length;

  const activeChanges = changes.filter(
    (c) =>
      c.status === "pending_review" ||
      c.status === "pending" ||
      c.status === "approved" ||
      (c.status === "rejected" && c.architectReview === "rejected")
  );
  const committedChanges = changes
    .filter((c) => c.status === "committed")
    .slice(0, 20);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {reviewingCount > 0 && (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: "#D4A843",
              }}
            >
              <div
                className="animate-spin rounded-full"
                style={{
                  width: "10px",
                  height: "10px",
                  border: "1.5px solid rgba(212, 168, 67, 0.3)",
                  borderTop: "1.5px solid #D4A843",
                }}
              />
              {reviewingCount} reviewing
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "12px",
              color: "var(--cream)",
              opacity: 0.6,
            }}
          >
            {pendingCount > 0 && `${pendingCount} ready`}
            {pendingCount > 0 && approvedCount > 0 && " \u00B7 "}
            {approvedCount > 0 && `${approvedCount} approved`}
            {rejectedByArchitectCount > 0 &&
              ` \u00B7 ${rejectedByArchitectCount} flagged`}
          </span>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={onApproveAll}
            className="rounded px-2.5 py-1 text-xs transition-colors"
            style={{
              fontFamily: "var(--font-runway)",
              background: "var(--steel-blue)",
              color: "var(--cream)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Approve All
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeChanges.length === 0 && (
          <div
            className="flex h-32 items-center justify-center"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "13px",
              color: "var(--cream)",
              opacity: 0.4,
            }}
          >
            No staged changes. Ask the Builder to write code.
          </div>
        )}

        {activeChanges.map((change) => (
          <StagedChangeCard
            key={change.id}
            change={change}
            onApprove={onApprove}
            onReject={onReject}
            onRetryReview={onRetryReview}
            isNew={newIds.has(change.id)}
          />
        ))}
      </div>

      {/* Commit section */}
      {approvedCount > 0 && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "rgba(233, 236, 240, 0.15)" }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 rounded border bg-transparent px-3 py-1.5 text-xs outline-none"
              style={{
                fontFamily: "var(--font-runway)",
                color: "var(--cream)",
                borderColor: "rgba(233, 236, 240, 0.2)",
              }}
            />
            <button
              onClick={() => {
                onCommit(commitMessage || "Update files");
                setCommitMessage("");
              }}
              className="rounded px-3 py-1.5 text-xs font-bold"
              style={{
                fontFamily: "var(--font-runway)",
                background: "var(--pure-blue)",
                color: "var(--cream)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Commit & Push
            </button>
          </div>
        </div>
      )}

      {/* Commit history */}
      {committedChanges.length > 0 && (
        <div
          className="border-t px-4 py-2 max-h-32 overflow-y-auto"
          style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              color: "var(--cream)",
              opacity: 0.4,
              textTransform: "uppercase",
            }}
          >
            Recent commits
          </span>
          {committedChanges.map((c) => (
            <div
              key={c.id}
              className="mt-1 flex items-center gap-2"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: "var(--cream)",
                opacity: 0.6,
              }}
            >
              <span className="truncate">{c.filePath}</span>
              <span style={{ opacity: 0.4 }}>
                {c.committedAt
                  ? new Date(c.committedAt).toLocaleTimeString()
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
