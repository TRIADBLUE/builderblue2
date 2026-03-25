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

interface TabInfo {
  key: CenterTab;
  label: string;
  icon: string;
  description: string;
}

const ALL_TABS: TabInfo[] = [
  { key: "staging", label: "Staging", icon: "📋", description: "Review and approve staged code changes" },
  { key: "files", label: "Files", icon: "📁", description: "Browse and edit project files" },
  { key: "terminal", label: "Terminal", icon: "⌨️", description: "Run commands in a project shell" },
  { key: "preview", label: "Preview", icon: "👁️", description: "Live preview of your running app" },
  { key: "git", label: "Git", icon: "🔀", description: "Commits, branches, and version control" },
  { key: "thread", label: "Thread", icon: "🧵", description: "Construction log of all AI activity" },
  { key: "style-guide", label: "Guide", icon: "🎨", description: "Design system — fonts, colors, spacing" },
  { key: "secrets", label: "Secrets", icon: "🔐", description: "Environment variables and API keys" },
  { key: "database", label: "Database", icon: "🗄️", description: "View and manage database tables" },
  { key: "services", label: "Services", icon: "⚙️", description: "Connected services and integrations" },
];

const DEFAULT_VISIBLE: CenterTab[] = ["staging", "files", "terminal", "preview", "git"];

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
  const [visibleTabs, setVisibleTabs] = useState<CenterTab[]>(DEFAULT_VISIBLE);
  const [showChooser, setShowChooser] = useState(false);

  const toggleTab = (key: CenterTab) => {
    setVisibleTabs((prev) => {
      if (prev.includes(key)) {
        // Don't remove if it's the last one
        if (prev.length <= 1) return prev;
        const next = prev.filter((k) => k !== key);
        // If we removed the active tab, switch to first remaining
        if (key === activeTab) setActiveTab(next[0]);
        return next;
      }
      return [...prev, key];
    });
  };

  const activeTabs = ALL_TABS.filter((t) => visibleTabs.includes(t.key));

  return (
    <div className="flex h-full flex-col runway" style={{ zIndex: 10 }}>
      {/* Tab bar */}
      <div
        className="flex items-center"
        style={{
          background: "#FFF5ED",
          borderBottom: "1px solid rgba(9, 8, 14, 0.1)",
          flexShrink: 0,
        }}
      >
        {activeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="transition-colors"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: activeTab === tab.key ? "#FFF5ED" : "#09080E",
              background: activeTab === tab.key ? "#14287D" : "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid #14287D" : "2px solid transparent",
              padding: "7px 12px",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        {/* "+" chooser button */}
        <button
          onClick={() => setShowChooser(!showChooser)}
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "13px",
            color: showChooser ? "#14287D" : "rgba(9,8,14,0.3)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "7px 10px",
            marginLeft: "auto",
            transition: "color 0.15s",
          }}
        >
          {showChooser ? "✕" : "+"}
        </button>
      </div>

      {/* Tab chooser dropdown */}
      {showChooser && (
        <div
          style={{
            background: "#FFF5ED",
            borderBottom: "1px solid rgba(9,8,14,0.1)",
            padding: "8px 12px",
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "var(--steel-blue)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Choose your tabs
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_TABS.map((tab) => {
              const isVisible = visibleTabs.includes(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => toggleTab(tab.key)}
                  className="flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-all"
                  style={{
                    background: isVisible ? "rgba(20, 40, 125, 0.06)" : "rgba(9,8,14,0.02)",
                    border: isVisible ? "1px solid rgba(20, 40, 125, 0.2)" : "1px solid rgba(9,8,14,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>{tab.icon}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-runway)", fontSize: "11px", fontWeight: 600, color: isVisible ? "#14287D" : "#09080E" }}>
                      {tab.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-content)", fontSize: "9px", color: "var(--steel-blue)", lineHeight: 1.3, marginTop: "1px" }}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
