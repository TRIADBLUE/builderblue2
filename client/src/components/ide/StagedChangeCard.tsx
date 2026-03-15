import { useState } from "react";
import type { StagedChange } from "@shared/types";

interface StagedChangeCardProps {
  change: StagedChange;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isNew?: boolean;
}

export function StagedChangeCard({
  change,
  onApprove,
  onReject,
  isNew = false,
}: StagedChangeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [animState, setAnimState] = useState<"enter" | "approved" | "rejected" | "">(
    isNew ? "enter" : ""
  );

  const borderColor =
    change.status === "approved"
      ? "#008060"
      : change.status === "rejected"
        ? "var(--ruby-red)"
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
        background: "var(--triad-black)",
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
              color: "var(--cream)",
            }}
          >
            {change.filePath}
          </span>
          <span
            className="rounded px-1.5 py-0.5"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              color: "var(--cream)",
              background: "var(--steel-blue)",
            }}
          >
            {change.proposedBy}
          </span>
        </div>

        {change.status === "pending" && (
          <div className="flex gap-1">
            <button
              onClick={handleApprove}
              className="rounded px-2 py-0.5 text-xs font-medium transition-colors"
              style={{
                fontFamily: "var(--font-runway)",
                background: "#008060",
                color: "var(--cream)",
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
                color: "var(--cream)",
              }}
            >
              Reject
            </button>
          </div>
        )}

        {change.status !== "pending" && (
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              color:
                change.status === "approved"
                  ? "#008060"
                  : change.status === "committed"
                    ? "var(--steel-blue)"
                    : "var(--ruby-red)",
              textTransform: "uppercase",
            }}
          >
            {change.status}
          </span>
        )}
      </div>

      {/* Diff preview */}
      <div
        className="overflow-x-auto px-3 pb-2"
        style={{ fontFamily: "var(--font-runway)", fontSize: "11px" }}
      >
        <pre className="m-0 whitespace-pre">
          {previewLines.map((line, i) => {
            let color = "var(--cream)";
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
