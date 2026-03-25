import { useState } from "react";

interface GitTabProps {
  projectId: string;
  branch: string;
  repoName: string | null;
}

export function GitTab({ projectId, branch, repoName }: GitTabProps) {
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [prBase, setPrBase] = useState("main");
  const [prStatus, setPrStatus] = useState<string | null>(null);

  const handleCreatePR = async () => {
    if (!prTitle.trim()) return;
    setPrStatus("Creating PR...");
    // PR creation will use the GitHub API via server endpoint
    setTimeout(() => {
      setPrStatus("PR endpoint requires GitHub token configuration");
    }, 500);
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--triad-black)" }}
    >
      {/* Branch info */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "var(--cream)",
              opacity: 0.5,
            }}
          >
            Branch
          </span>
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
          {repoName && (
            <span
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: "var(--cream)",
                opacity: 0.3,
              }}
            >
              {repoName}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-4">
          <button
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "12px",
              color: "var(--cream)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Pull
          </button>
          <button
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "12px",
              color: "var(--cream)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Push
          </button>
        </div>
      </div>

      {/* Create PR */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3
          className="mb-3"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "12px",
            color: "var(--cream)",
            opacity: 0.6,
            textTransform: "uppercase",
          }}
        >
          Create Pull Request
        </h3>

        <div className="space-y-2">
          <input
            type="text"
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            placeholder="PR title"
            className="w-full rounded border bg-transparent px-3 py-1.5 text-xs outline-none"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--cream)",
              borderColor: "rgba(233, 236, 240, 0.2)",
            }}
          />
          <textarea
            value={prDescription}
            onChange={(e) => setPrDescription(e.target.value)}
            placeholder="Description..."
            rows={4}
            className="w-full resize-none rounded border bg-transparent px-3 py-1.5 text-xs outline-none"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--cream)",
              borderColor: "rgba(233, 236, 240, 0.2)",
            }}
          />
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: "var(--cream)",
                opacity: 0.5,
              }}
            >
              Base:
            </span>
            <input
              type="text"
              value={prBase}
              onChange={(e) => setPrBase(e.target.value)}
              className="w-24 rounded border bg-transparent px-2 py-1 text-xs outline-none"
              style={{
                fontFamily: "var(--font-runway)",
                color: "var(--cream)",
                borderColor: "rgba(233, 236, 240, 0.2)",
              }}
            />
          </div>
          <button
            onClick={handleCreatePR}
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--cream)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Create PR
          </button>
          {prStatus && (
            <div
              className="mt-2 text-xs"
              style={{
                fontFamily: "var(--font-runway)",
                color: "var(--cream)",
                opacity: 0.5,
              }}
            >
              {prStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
