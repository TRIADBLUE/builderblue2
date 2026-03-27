import { useState, useCallback, useEffect, useRef } from "react";
import type {
  ActivePane,
  AIProvider,
  ConversationMessage,
  ProjectFile,
} from "@shared/types";
import { TopNav } from "./TopNav";
import { ArchitectPane } from "./ArchitectPane";
import { BuilderPane } from "./BuilderPane";
import { CenterPanel } from "./CenterPanel";
import { TodoPanel } from "./TodoPanel";
import { ComputeWarningBanner } from "./ComputeWarningBanner";
import { ComputeDepletedModal } from "./ComputeDepletedModal";
import { UpgradeToast } from "./UpgradeToast";
import { useConversation } from "../../hooks/useConversation";
import { useStaging } from "../../hooks/useStaging";
import { useComputeStatus } from "../../hooks/useComputeStatus";
import { useAuth } from "../../hooks/useAuth";

interface IDEShellProps {
  projectId: string;
  projectName: string;
  branch: string;
  repoName: string | null;
  files: ProjectFile[];
  onProjectNameChange: (name: string) => void;
  defaultArchitectConfig?: { provider: string; model: string } | null;
  defaultBuilderConfig?: { provider: string; model: string } | null;
}

export function IDEShell({
  projectId,
  projectName,
  branch,
  repoName,
  files,
  onProjectNameChange,
  defaultArchitectConfig,
  defaultBuilderConfig,
}: IDEShellProps) {
  const { user } = useAuth();
  const { status: computeStatus } = useComputeStatus();
  const staging = useStaging();

  // Active pane state
  const [activePane, setActivePane] = useState<ActivePane>(null);
  const [flashPane, setFlashPane] = useState<"architect" | "builder" | null>(null);

  // Layout customization
  type LayoutPreset = "full" | "focus-build" | "focus-plan" | "focus-review";
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("full");
  const [showArchitect, setShowArchitect] = useState(true);
  const [showBuilder, setShowBuilder] = useState(true);
  const [showRunway, setShowRunway] = useState(true);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [reversed, setReversed] = useState(false);

  // Apply layout presets
  const applyPreset = useCallback((preset: LayoutPreset) => {
    setLayoutPreset(preset);
    switch (preset) {
      case "full":
        setShowArchitect(true);
        setShowBuilder(true);
        setShowRunway(true);
        break;
      case "focus-build":
        setShowArchitect(false);
        setShowBuilder(true);
        setShowRunway(true);  // Builder + Runway
        break;
      case "focus-plan":
        setShowArchitect(true);
        setShowBuilder(false);
        setShowRunway(true);  // Architect + Runway
        break;
      case "focus-review":
        setShowArchitect(false);
        setShowBuilder(false);
        setShowRunway(true);  // Runway only (full width review)
        break;
    }
  }, []);

  // Architect conversation
  const architectConvo = useConversation();
  const [architectProvider, setArchitectProvider] = useState<AIProvider>(
    (defaultArchitectConfig?.provider as AIProvider) ?? "claude"
  );
  const [architectModel, setArchitectModel] = useState(
    defaultArchitectConfig?.model ?? "claude-opus-4-20250514"
  );

  // Builder conversation
  const builderConvo = useConversation();
  const [builderProvider, setBuilderProvider] = useState<AIProvider>(
    (defaultBuilderConfig?.provider as AIProvider) ?? "claude"
  );
  const [builderModel, setBuilderModel] = useState(
    defaultBuilderConfig?.model ?? "claude-opus-4-20250514"
  );
  const [builderInput, setBuilderInput] = useState("");

  // New staged IDs for animation
  const [newStagedIds, setNewStagedIds] = useState<Set<string>>(new Set());

  // Upgrade toast
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  // Load staged changes
  useEffect(() => {
    staging.loadChanges(projectId);
  }, [projectId]);

  // Initialize conversations
  useEffect(() => {
    architectConvo.loadConversations(projectId);
    builderConvo.loadConversations(projectId);
  }, [projectId]);

  // Resizable column widths (percentages)
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: "left" | "right";
    startX: number;
    startWidths: [number, number, number];
  } | null>(null);

  // Default widths: [architect%, builder%, runway%]
  const [colWidths, setColWidths] = useState<[number, number, number]>([30, 30, 40]);

  // Reset widths when visibility changes
  useEffect(() => {
    const visible = [showArchitect, showBuilder, showRunway].filter(Boolean).length;
    if (visible === 3) {
      setColWidths([30, 30, 40]);
    } else if (visible === 2) {
      if (showArchitect && showBuilder) setColWidths([50, 50, 0]);
      else if (showArchitect && showRunway) setColWidths([40, 0, 60]);
      else if (showBuilder && showRunway) setColWidths([0, 40, 60]);
    } else {
      setColWidths([
        showArchitect ? 100 : 0,
        showBuilder ? 100 : 0,
        showRunway ? 100 : 0,
      ]);
    }
  }, [showArchitect, showBuilder, showRunway]);

  // Drag-to-resize handlers
  const handleResizeStart = useCallback((handle: "left" | "right", e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      handle,
      startX: e.clientX,
      startWidths: [...colWidths],
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [colWidths]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaPercent = ((e.clientX - drag.startX) / containerWidth) * 100;
      const [a, b, c] = drag.startWidths;
      const MIN = 15; // minimum column width %

      if (drag.handle === "left") {
        // Between architect and builder (or architect and runway if builder hidden)
        if (showArchitect && showBuilder) {
          const newA = Math.max(MIN, Math.min(a + deltaPercent, a + b - MIN));
          const newB = a + b - newA;
          setColWidths([newA, newB, c]);
        } else if (showArchitect && showRunway && !showBuilder) {
          const newA = Math.max(MIN, Math.min(a + deltaPercent, a + c - MIN));
          const newC = a + c - newA;
          setColWidths([newA, 0, newC]);
        }
      } else {
        // Between builder and runway (or architect and runway if builder hidden)
        if (showBuilder && showRunway) {
          const newB = Math.max(MIN, Math.min(b + deltaPercent, b + c - MIN));
          const newC = b + c - newB;
          setColWidths([a, newB, newC]);
        }
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [showArchitect, showBuilder, showRunway]);

  const widths = {
    left: `${colWidths[0]}%`,
    center: `${colWidths[1]}%`,
    right: `${colWidths[2]}%`,
  };

  // Hand-off handlers
  // Handoff animation state
  const [handoffDirection, setHandoffDirection] = useState<"to-builder" | "to-architect" | null>(null);

  const handleHandToBuilder = useCallback((content: string) => {
    setHandoffDirection("to-builder");
    setTimeout(() => {
      setBuilderInput(content);
      setActivePane("builder");
      setFlashPane("builder");
      setHandoffDirection(null);
      setTimeout(() => setFlashPane(null), 400);
    }, 500);
  }, []);

  const handleHandToArchitect = useCallback((content: string) => {
    setHandoffDirection("to-architect");
    setTimeout(() => {
      setActivePane("architect");
      setFlashPane("architect");
      setHandoffDirection(null);
      setTimeout(() => setFlashPane(null), 400);
    }, 500);
  }, []);

  // Message handlers
  const handleArchitectMessage = useCallback(
    async (content: string) => {
      let convo = architectConvo.conversation;
      if (!convo) {
        convo = await architectConvo.createConversation(
          projectId,
          "architect",
          architectProvider,
          architectModel
        );
      }
      await architectConvo.sendMessage(convo.id, content);
    },
    [architectConvo, projectId, architectProvider, architectModel]
  );

  const handleBuilderMessage = useCallback(
    async (content: string) => {
      let convo = builderConvo.conversation;
      if (!convo) {
        convo = await builderConvo.createConversation(
          projectId,
          "builder",
          builderProvider,
          builderModel
        );
      }
      await builderConvo.sendMessage(convo.id, content, (ids) => {
        setNewStagedIds((prev) => new Set([...prev, ...ids]));
        // Refresh staged changes
        staging.loadChanges(projectId);
        // Clear new flags after animation
        setTimeout(() => {
          setNewStagedIds(new Set());
        }, 1000);
      });
    },
    [builderConvo, projectId, builderProvider, builderModel, staging]
  );

  // Staging handlers
  const handleCommit = useCallback(
    async (message: string) => {
      await staging.commitChanges(projectId);
    },
    [staging, projectId]
  );

  const handleSaveAsProposal = useCallback(
    async (filePath: string, content: string) => {
      const { api } = await import("../../lib/api");
      await api.fetch("/api/staging", {
        method: "POST",
        body: {
          projectId,
          filePath,
          proposedContent: content,
          proposedBy: "user",
        },
      });
      staging.loadChanges(projectId);
    },
    [projectId, staging]
  );

  const architectMessages = (architectConvo.conversation?.messages ?? []) as ConversationMessage[];
  const builderMessages = (builderConvo.conversation?.messages ?? []) as ConversationMessage[];

  return (
    <div className="flex h-screen flex-col ide-layout">
      {/* Top Nav */}
      <TopNav
        projectName={projectName}
        branch={branch}
        lastSaved={null}
        computeStatus={computeStatus}
        userName={user?.name ?? ""}
        onProjectNameChange={onProjectNameChange}
        onDeploy={() => {}}
      />

      {/* Compute warning */}
      <ComputeWarningBanner status={computeStatus} />

      {/* Layout controls bar */}
      <div className="flex items-center justify-between px-3 py-1" style={{ background: "#FFF5ED", borderBottom: "1px solid rgba(9,8,14,0.06)", minHeight: "28px" }}>
        <div className="flex items-center gap-2">
          {/* Panel toggles */}
          {[
            { key: "architect" as const, label: "Architect", color: "#3E806B", visible: showArchitect, toggle: setShowArchitect },
            { key: "runway" as const, label: "Runway", color: "#14287D", visible: showRunway, toggle: setShowRunway },
            { key: "builder" as const, label: "Builder", color: "#82323C", visible: showBuilder, toggle: setShowBuilder },
          ].map((p) => (
            <button
              key={p.key}
              className="btn"
              onClick={() => p.toggle(!p.visible)}
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "9px",
                fontWeight: 600,
                color: p.visible ? "#FFF5ED" : p.color,
                background: p.visible ? p.color : "transparent",
                border: `1px solid ${p.color}`,
                borderRadius: "4px",
                padding: "2px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            className="btn"
            onClick={() => setReversed(!reversed)}
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "9px",
              color: "var(--steel-blue)",
              background: "transparent",
              border: "1px solid rgba(9,8,14,0.1)",
              borderRadius: "4px",
              padding: "2px 8px",
              cursor: "pointer",
            }}
          >
            {reversed ? "⇄ Reversed" : "⇄ Reverse"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* Layout presets */}
          {([
            { key: "full" as LayoutPreset, label: "Full IDE" },
            { key: "focus-build" as LayoutPreset, label: "Build" },
            { key: "focus-plan" as LayoutPreset, label: "Plan" },
            { key: "focus-review" as LayoutPreset, label: "Review" },
          ]).map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "9px",
                color: layoutPreset === p.key ? "var(--steel-blue)" : "rgba(9,8,14,0.35)",
                background: "transparent",
                border: "none",
                padding: "2px 6px",
                cursor: "pointer",
                fontWeight: layoutPreset === p.key ? 600 : 400,
                transition: "color 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Three panel layout: Architect | Builder | Staging Runway */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ flexDirection: reversed ? "row-reverse" : "row" }}>
        {/* LEFT: Architect + TODO panel */}
        {showArchitect && (
        <div
          className={`ide-pane flex ${activePane === "builder" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "architect" ? "pane-flash" : ""}`}
          style={{
            width: widths.left,
            borderLeft:
              activePane === "architect"
                ? "3px solid #3E806B"
                : "3px solid transparent",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <TodoPanel projectId={projectId} />
          <div className="flex-1 overflow-hidden">
            <ArchitectPane
              isActive={activePane === "architect"}
              messages={architectMessages}
              isStreaming={architectConvo.isStreaming}
              streamedText={architectConvo.streamedText}
              provider={architectProvider}
              model={architectModel}
              onProviderChange={setArchitectProvider}
              onModelChange={setArchitectModel}
              onSendMessage={handleArchitectMessage}
              onHandToBuilder={handleHandToBuilder}
              onFocus={() => setActivePane("architect")}
            />
          </div>
        </div>
        )}

        {/* Resize handle: between Architect and Builder (or Runway if Builder hidden) */}
        {showArchitect && (showBuilder || showRunway) && (
          <div
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart("left", e)}
            style={{
              width: "5px",
              cursor: "col-resize",
              background: "transparent",
              position: "relative",
              flexShrink: 0,
              zIndex: 20,
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "2px",
              width: "1px",
              background: "rgba(9,8,14,0.08)",
              transition: "background 0.15s, width 0.15s",
            }} />
          </div>
        )}

        {/* CENTER: Builder */}
        {showBuilder && (
        <div
          className={`ide-pane ${activePane === "architect" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "builder" ? "pane-flash" : ""}`}
          style={{
            width: widths.center,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <BuilderPane
            isActive={activePane === "builder"}
            messages={builderMessages}
            isStreaming={builderConvo.isStreaming}
            streamedText={builderConvo.streamedText}
            provider={builderProvider}
            model={builderModel}
            inputValue={builderInput}
            onProviderChange={setBuilderProvider}
            onModelChange={setBuilderModel}
            onSendMessage={handleBuilderMessage}
            onHandToArchitect={handleHandToArchitect}
            onFocus={() => setActivePane("builder")}
            onInputChange={setBuilderInput}
          />
        </div>
        )}

        {/* Resize handle: between Builder and Runway */}
        {showBuilder && showRunway && (
          <div
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart("right", e)}
            style={{
              width: "5px",
              cursor: "col-resize",
              background: "transparent",
              position: "relative",
              flexShrink: 0,
              zIndex: 20,
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "2px",
              width: "1px",
              background: "rgba(9,8,14,0.08)",
              transition: "background 0.15s, width 0.15s",
            }} />
          </div>
        )}

        {/* RIGHT: Staging Runway (with Files, Preview, Git tabs) */}
        {showRunway && (
        <div
          style={{
            width: widths.right,
            borderRight:
              activePane === "builder"
                ? "3px solid #14287D"
                : "3px solid transparent",
            flexShrink: 0,
          }}
          className="ide-pane ide-pane-active"
        >
          <CenterPanel
            projectId={projectId}
            projectName={projectName}
            branch={branch}
            repoName={repoName}
            files={files}
            stagedChanges={staging.changes}
            newStagedIds={newStagedIds}
            onApproveChange={staging.approveChange}
            onRejectChange={staging.rejectChange}
            onApproveAll={() => staging.approveAll(projectId)}
            onCommit={handleCommit}
            onSaveAsProposal={handleSaveAsProposal}
            onRetryReview={staging.retryReview}
          />
        </div>
        )}
      </div>

      {/* Handoff animation overlay */}
      {handoffDirection && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: handoffDirection === "to-builder" ? "45%" : "15%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div
            className={handoffDirection === "to-builder" ? "handoff-enter" : "handoff-enter"}
            style={{
              background: "var(--deep-blue)",
              color: "var(--cream)",
              padding: "8px 20px",
              borderRadius: "20px",
              fontFamily: "var(--font-label)",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {handoffDirection === "to-builder"
              ? "📋 Handing plan to Builder →"
              : "← 🔍 Sending to Architect for review"}
          </div>
        </div>
      )}

      {/* Depleted modal */}
      {computeStatus.level === "depleted" && (
        <ComputeDepletedModal
          onPurchase={(block) => {
            // Purchase API call
            console.log("Purchase block:", block);
          }}
          onSaveAndWait={() => {}}
          resetDate="April 1, 2026"
        />
      )}

      {/* Upgrade toast */}
      {showUpgradeToast && (
        <UpgradeToast
          consecutiveMonths={3}
          onViewOptions={() => setShowUpgradeToast(false)}
          onDismiss={() => setShowUpgradeToast(false)}
        />
      )}
    </div>
  );
}
