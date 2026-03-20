import { useState } from "react";
import type { CenterTab, StagedChange, ProjectFile } from "@shared/types";
import { StagingTab } from "./tabs/StagingTab";
import { FilesTab } from "./tabs/FilesTab";
import { TerminalTab } from "./tabs/TerminalTab";
import { SecretsTab } from "./tabs/SecretsTab";
import { DatabaseTab } from "./tabs/DatabaseTab";
import { PreviewTab } from "./tabs/PreviewTab";
import { GitTab } from "./tabs/GitTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { ThreadTab } from "./tabs/ThreadTab";
import { StyleGuideTab } from "./tabs/StyleGuideTab";

interface CenterPanelProps {
  projectId: string;
  projectName: string;
  branch: string;
  repoName: string | null;
  files: ProjectFile[];
  stagedChanges: StagedChange[];
  newStagedIds: Set<string>;
  onApproveChange: (id: string) => void;
  onRejectChange: (id: string) => void;
  onApproveAll: () => void;
  onCommit: (message: string) => void;
  onSaveAsProposal: (filePath: string, content: string) => void;
  onRetryReview?: (id: string) => void;
}

const TABS: { key: CenterTab; label: string }[] = [
  { key: "staging", label: "Staging" },
  { key: "files", label: "Files" },
  { key: "terminal", label: "Terminal" },
  { key: "secrets", label: "Secrets" },
  { key: "database", label: "Database" },
  { key: "preview", label: "Preview" },
  { key: "git", label: "Git" },
  { key: "services", label: "Services" },
  { key: "thread", label: "🧵 Thread" },
  { key: "style-guide", label: "🎨 Guide" },
];

export function CenterPanel({
  projectId,
  projectName,
  branch,
  repoName,
  files,
  stagedChanges,
  newStagedIds,
  onApproveChange,
  onRejectChange,
  onApproveAll,
  onCommit,
  onSaveAsProposal,
  onRetryReview,
}: CenterPanelProps) {
  const [activeTab, setActiveTab] = useState<CenterTab>("staging");

  return (
    <div className="flex h-full flex-col runway" style={{ zIndex: 10 }}>
      {/* Tab bar */}
      <div
        className="flex"
        style={{
          background: "#FFF5ED",
          borderBottom: "1px solid rgba(9, 8, 14, 0.1)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 transition-colors"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: activeTab === tab.key ? "#FFF5ED" : "#09080E",
              background:
                activeTab === tab.key
                  ? "#14287D"
                  : "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #14287D"
                  : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-hidden"
        style={{ background: "#FFF5ED" }}
      >
        {activeTab === "staging" && (
          <StagingTab
            changes={stagedChanges}
            newIds={newStagedIds}
            onApprove={onApproveChange}
            onReject={onRejectChange}
            onApproveAll={onApproveAll}
            onCommit={onCommit}
            onRetryReview={onRetryReview}
          />
        )}
        {activeTab === "files" && (
          <FilesTab files={files} onSaveAsProposal={onSaveAsProposal} />
        )}
        {activeTab === "terminal" && (
          <TerminalTab projectId={projectId} projectName={projectName} />
        )}
        {activeTab === "secrets" && (
          <SecretsTab projectId={projectId} secrets={[]} onRefresh={() => {}} />
        )}
        {activeTab === "database" && <DatabaseTab projectId={projectId} />}
        {activeTab === "preview" && <PreviewTab projectId={projectId} />}
        {activeTab === "git" && (
          <GitTab
            projectId={projectId}
            branch={branch}
            repoName={repoName}
          />
        )}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "thread" && <ThreadTab projectId={projectId} />}
        {activeTab === "style-guide" && <StyleGuideTab projectId={projectId} />}
      </div>
    </div>
  );
}
