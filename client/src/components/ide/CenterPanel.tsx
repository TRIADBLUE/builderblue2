import { useState, useCallback } from "react";
import { PanelRightClose } from "lucide-react";
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
  builderIsStreaming?: boolean;
  builderStreamedText?: string;
  builderMessages?: ConversationMessage[];
  crossTalkQuestion?: string | null;
  crossTalkActive?: boolean;
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
  builderIsStreaming = false,
  builderStreamedText = "",
  builderMessages = [],
  crossTalkQuestion = null,
  crossTalkActive = false,
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
    <div className="flex h-full flex-col runway glass-bg" style={{ zIndex: 10, backgroundColor: "transparent" }}>
      {/* Runway mode toggle: Architect Ideation / Builder Construction */}
      {onRunwayToggle && (
        <RunwayToggle mode={runwayMode} onToggle={onRunwayToggle} />
      )}

      {/* Architect Ideation mode */}
      {runwayMode === "architect" && (
        <>
          {/* Show real streaming text while Architect is thinking */}
          {architectIsStreaming && (
            <div style={{
              padding: "16px 20px",
              overflowY: "auto",
              flex: 1,
            }}>
              <div style={{
                fontFamily: "var(--font-label)",
                fontSize: "9px",
                color: "#043B40",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: "12px",
                textShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 2px rgba(255, 255, 255, 0.9)",
              }}>
                architect
                <div style={{
                  marginTop: "6px",
                  height: "2px",
                  borderRadius: "1px",
                  background: "linear-gradient(90deg, transparent, #043B40, transparent)",
                  animation: "thinking-pulse 1.2s ease-in-out infinite",
                }} />
              </div>
              <div
                className="text-ai-architect"
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {architectStreamedText}
                <span className="streaming-cursor streaming-cursor-architect" />
              </div>
            </div>
          )}
          {/* Show ideation view (prototypes, specs, text) when there's content */}
          {(!architectIsStreaming || architectStreamedText.includes("```prototype") || architectStreamedText.includes("```html")) && (
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
        </>
      )}

      {/* Builder Construction mode — tab bar + content */}
      {runwayMode === "builder" && (
      <>
      <div
        className="flex items-center"
        style={{
          background: "inherit",
          borderBottom: "1px solid var(--ide-border)",
          flexShrink: 0,
        }}
      >
        {openTabs.map((tab) => (
          <div
            key={tab}
            className="flex items-center"
            style={{ borderRight: "1px solid var(--ide-border)" }}
          >
            <button
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                color: activeTab === tab ? "var(--ide-text)" : "var(--ide-text-muted)",
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
                  color: "var(--ide-text-muted)",
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
            color: "var(--ide-text-dim)",
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
              color: "var(--ide-text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            title="Collapse panel"
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ide-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ide-text-muted)")}
          >
            <PanelRightClose size={14} />
          </button>
        )}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-hidden glass-bg"
        style={{ background: "transparent", position: "relative" }}
      >
        {/* Builder real streaming overlay */}
        {builderIsStreaming && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            background: "var(--ide-bg, #131F38)",
            overflowY: "auto",
            padding: "16px 20px",
          }}>
            <div style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "#520322",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontVariant: "small-caps",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--ide-border, rgba(251,246,238,0.15))",
            }}>
              BUILDER IS WORKING
              <div style={{
                marginTop: "6px",
                height: "2px",
                borderRadius: "1px",
                background: "linear-gradient(90deg, transparent, #520322, transparent)",
                animation: "thinking-pulse 1.2s ease-in-out infinite",
              }} />
            </div>
            {/* Cross-talk: Architect → Builder consultation */}
            {crossTalkQuestion && (
              <div style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "rgba(4, 59, 64, 0.08)",
                borderRadius: "8px",
                borderLeft: "3px solid #043B40",
              }}>
                <div style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "10px",
                  color: "#043B40",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}>
                  Architect asked
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "var(--ai-message-size, 15px)",
                  color: "#043B40",
                  lineHeight: 1.5,
                }}>
                  {crossTalkQuestion}
                </div>
              </div>
            )}
            <div
              className="text-ai-builder"
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {builderStreamedText}
              <span className="streaming-cursor streaming-cursor-builder" />
            </div>
          </div>
        )}
        {/* Cross-talk result — shows briefly after Builder finishes */}
        {!builderIsStreaming && crossTalkActive && crossTalkQuestion && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 25,
            background: "var(--ide-bg, #131F38)",
            padding: "16px 20px",
            overflowY: "auto",
          }}>
            <div style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "var(--ide-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}>
              ARCHITECT ↔ BUILDER
            </div>
            <div style={{
              padding: "12px 16px",
              background: "rgba(4, 59, 64, 0.08)",
              borderRadius: "8px",
              borderLeft: "3px solid #043B40",
              marginBottom: "12px",
            }}>
              <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "#043B40", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", fontWeight: 600 }}>
                Architect asked
              </div>
              <div className="text-ai-architect" style={{ fontSize: "13px" }}>
                {crossTalkQuestion}
              </div>
            </div>
            <div style={{
              padding: "12px 16px",
              background: "rgba(82, 3, 34, 0.06)",
              borderRadius: "8px",
              borderLeft: "3px solid #520322",
            }}>
              <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "#520322", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", fontWeight: 600 }}>
                Builder responded
              </div>
              <div className="text-ai-builder" style={{ fontSize: "13px", whiteSpace: "pre-wrap" }}>
                {builderMessages.length > 0 ? builderMessages[builderMessages.length - 1]?.content ?? "" : ""}
              </div>
            </div>
          </div>
        )}
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
