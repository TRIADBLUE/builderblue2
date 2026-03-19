import { useState } from "react";
import type { StagedChange } from "@shared/types";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface StagedChangeCardProps {
  change: StagedChange;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRetryReview?: (id: string) => void;
  isNew?: boolean;
}

export function StagedChangeCard({
  change,
  onApprove,
  onReject,
  onRetryReview,
  isNew = false,
}: StagedChangeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [animState, setAnimState] = useState<"enter" | "approved" | "rejected" | "">(
    isNew ? "enter" : ""
  );

  const isArchitectReviewing = change.architectReview === "reviewing";
  const isArchitectApproved = change.architectReview === "approved";
  const isArchitectRejected = change.architectReview === "rejected";
  const canUserApprove = isArchitectApproved && change.status === "pending";

  const borderColor =
    change.status === "approved"
      ? "#008060"
      : change.status === "rejected" || isArchitectRejected
        ? "var(--ruby-red)"
        : isArchitectReviewing
          ? "#D4A843"
          : canUserApprove
            ? "var(--steel-blue)"
            : "var(--steel-blue)";

  const handleApprove = () => {
    setAnimState("approved");
    onApprove(change.id);
  };

  const handleReject = () => {
    setAnimState("rejected");
    onReject(change.id);
  };

  const diffLines = change.diff.split("\n");
  const previewLines = expanded ? diffLines : diffLines.slice(0, 8);

  return (
    <div
      className={`mb-3 rounded-md ${animState === "enter" ? "staged-card-enter" : animState === "approved" ? "staged-card-approved" : animState === "rejected" ? "staged-card-rejected" : ""}`}
      style={{
        background: "#D0B799",
        border: "1px solid var(--card-border)",
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "12px",
              color: "var(--triad-black)",
            }}
          >
            {change.filePath}
          </span>
          <span
            className="rounded px-1.5 py-0.5"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              color: "var(--triad-black)",
              background: "var(--steel-blue)",
            }}
          >
            {change.proposedBy}
          </span>
        </div>

        {/* Architect reviewing spinner */}
        {isArchitectReviewing && (
          <ThinkingIndicator role="reviewer" isActive={true} context={change.filePath} />
        )}

        {/* Architect approved — user can now approve/reject */}
        {canUserApprove && (
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "9px",
                color: "#008060",
                background: "rgba(0, 128, 96, 0.15)",
                border: "1px solid rgba(0, 128, 96, 0.3)",
              }}
            >
              Architect Approved
            </span>
            <div className="flex gap-1">
              <button
                onClick={handleApprove}
                className="rounded px-2 py-0.5 text-xs font-medium transition-colors"
                style={{
                  fontFamily: "var(--font-runway)",
                  background: "#008060",
                  color: "#FFF5ED",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="rounded px-2 py-0.5 text-xs font-medium transition-colors"
                style={{
                  fontFamily: "var(--font-runway)",
                  background: "var(--ruby-red)",
                  color: "#FFF5ED",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Architect rejected */}
        {isArchitectRejected && change.status !== "committed" && (
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "9px",
                color: "var(--ruby-red)",
                background: "rgba(200, 50, 50, 0.15)",
                border: "1px solid rgba(200, 50, 50, 0.3)",
              }}
            >
              Architect Rejected
            </span>
            {onRetryReview && (
              <button
                onClick={() => onRetryReview(change.id)}
                className="rounded px-2 py-0.5 text-xs transition-colors"
                style={{
                  fontFamily: "var(--font-runway)",
                  background: "transparent",
                  color: "var(--steel-blue)",
                  border: "1px solid var(--steel-blue)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Already approved/committed by user */}
        {(change.status === "approved" || change.status === "committed") && (
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              color:
                change.status === "approved"
                  ? "#008060"
                  : "var(--steel-blue)",
              textTransform: "uppercase",
            }}
          >
            {change.status}
          </span>
        )}
      </div>

      {/* Architect review note */}
      {change.architectReviewNote && (
        <div
          className="mx-3 mb-2 rounded px-2 py-1"
          style={{
            background: isArchitectRejected
              ? "rgba(200, 50, 50, 0.08)"
              : "rgba(0, 128, 96, 0.08)",
            borderLeft: `2px solid ${isArchitectRejected ? "var(--ruby-red)" : "#008060"}`,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "var(--triad-black)",
              opacity: 0.8,
            }}
          >
            <strong style={{ opacity: 0.6 }}>Architect:</strong>{" "}
            {change.architectReviewNote}
          </span>
        </div>
      )}

      {/* Diff preview */}
      <div
        className="overflow-x-auto px-3 pb-2"
        style={{ fontFamily: "var(--font-runway)", fontSize: "11px" }}
      >
        <pre className="m-0 whitespace-pre">
          {previewLines.map((line, i) => {
            let color = "var(--triad-black)";
            if (line.startsWith("+") && !line.startsWith("+++"))
              color = "#008060";
            if (line.startsWith("-") && !line.startsWith("---"))
              color = "var(--ruby-red)";
            if (line.startsWith("@@")) color = "var(--steel-blue)";
            return (
              <div key={i} style={{ color, opacity: 0.9 }}>
                {line}
              </div>
            );
          })}
        </pre>
        {diffLines.length > 8 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "var(--steel-blue)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded
              ? "Show less"
              : `View full diff (${diffLines.length} lines)`}
          </button>
        )}
      </div>
    </div>
  );
}
