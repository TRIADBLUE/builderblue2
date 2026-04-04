import { useState, useCallback } from "react";
import type { CenterTab, StagedChange, ProjectFile, ConversationMessage } from "@shared/types";
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
import { ToolsFilesTab } from "./tabs/ToolsFilesTab";
import { ComputeTab } from "./tabs/ComputeTab";
import { RunwayToggle } from "./RunwayToggle";
import { ArchitectIdeationView } from "./ArchitectIdeationView";

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
  onCollapse?: () => void;
  runwayMode?: "architect" | "builder";
  onRunwayToggle?: (mode: "architect" | "builder") => void;
  architectMessages?: ConversationMessage[];
  architectIsStreaming?: boolean;
  architectStreamedText?: string;
  prototypeVersion?: number;
  prototypeStatus?: "draft" | "approved" | "superseded";
  onApprovePrototype?: (htmlContent: string, technicalSpec: string) => void;
  onIteratePrototype?: () => void;
}

const TAB_LABELS: Record<string, string> = {
  tools: "Tools & Files",
  staging: "Staging",
  files: "Files",
  terminal: "Terminal",
  preview: "Preview",
  git: "Git",
  thread: "Thread",
  "style-guide": "Guide",
  secrets: "Secrets",
  database: "Database",
  services: "Services",
  compute: "Compute",
};

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
  onCollapse,
  runwayMode = "builder",
  onRunwayToggle,
  architectMessages = [],
  architectIsStreaming = false,
  architectStreamedText = "",
  prototypeVersion = 1,
  prototypeStatus = "draft",
  onApprovePrototype,
  onIteratePrototype,
}: CenterPanelProps) {
  const [activeTab, setActiveTab] = useState<CenterTab>("tools");
  const [openTabs, setOpenTabs] = useState<CenterTab[]>(["tools"]);

  // Open a tool tab from the Tools & Files page
  const handleOpenTool = useCallback((tab: CenterTab) => {
    setOpenTabs((prev) => {
      if (prev.includes(tab)) return prev;
      return [...prev, tab];
    });
    setActiveTab(tab);
  }, []);

  // Close a tab (can't close Tools & Files)
  const handleCloseTab = useCallback((tab: CenterTab) => {
    if (tab === "tools") return;
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== tab);
      return next;
    });
    if (activeTab === tab) setActiveTab("tools");
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col runway glass-bg" style={{ zIndex: 10 }}>
      {/* Runway mode toggle: Architect Ideation / Builder Construction */}
      {onRunwayToggle && (
        <RunwayToggle mode={runwayMode} onToggle={onRunwayToggle} />
      )}

      {/* Architect Ideation mode */}
      {runwayMode === "architect" && (
        <ArchitectIdeationView
          messages={architectMessages}
          isStreaming={architectIsStreaming}
          streamedText={architectStreamedText}
          prototypeVersion={prototypeVersion}
          prototypeStatus={prototypeStatus}
          onApprovePrototype={onApprovePrototype ?? (() => {})}
          onIteratePrototype={onIteratePrototype ?? (() => {})}
        />
      )}

      {/* Builder Construction mode — tab bar + content */}
      {runwayMode === "builder" && (
      <>
      <div
        className="flex items-center"
        style={{
          background: "inherit",
          borderBottom: "1px solid rgba(9, 8, 14, 0.08)",
          flexShrink: 0,
        }}
      >
        {openTabs.map((tab) => (
          <div
            key={tab}
            className="flex items-center"
            style={{ borderRight: "1px solid rgba(9, 8, 14, 0.06)" }}
          >
            <button
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: activeTab === tab ? "#00203A" : "rgba(9, 8, 14, 0.45)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px 6px 10px",
                whiteSpace: "nowrap",
                fontWeight: activeTab === tab ? 600 : 400,
                transition: "color 0.15s",
              }}
            >
              {TAB_LABELS[tab] ?? tab}
            </button>
            {/* Close button (not on Tools & Files) */}
            {tab !== "tools" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab); }}
                style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "10px",
                  color: "rgba(9,8,14,0.25)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px 4px 2px",
                  lineHeight: 1,
                }}
                title={`Close ${TAB_LABELS[tab] ?? tab}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {/* Add tab button */}
        <button
          onClick={() => setActiveTab("tools")}
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "14px",
            color: "rgba(9,8,14,0.3)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
            transition: "color 0.15s",
          }}
          title="Open a tool"
        >
          +
        </button>
        {/* Spacer pushes collapse button to the right */}
        <div style={{ flex: 1 }} />
        {/* Collapse panel button */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "13px",
              color: "rgba(9,8,14,0.25)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            title="Collapse panel"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(9,8,14,0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(9,8,14,0.25)")}
          >
            ▷
          </button>
        )}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-hidden glass-bg"
        style={{ background: "#FFF5ED" }}
      >
        {activeTab === "tools" && (
          <ToolsFilesTab
            files={files}
            onOpenTool={handleOpenTool}
            onSaveAsProposal={onSaveAsProposal}
          />
        )}
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
        {activeTab === "compute" && <ComputeTab projectId={projectId} />}
      </div>
      </>
      )}
    </div>
  );
}
