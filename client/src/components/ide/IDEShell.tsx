import { useState, useCallback, useEffect } from "react";
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
}

export function IDEShell({
  projectId,
  projectName,
  branch,
  repoName,
  files,
  onProjectNameChange,
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
  const [architectProvider, setArchitectProvider] = useState<AIProvider>("claude");
  const [architectModel, setArchitectModel] = useState("claude-opus-4-20250514");

  // Builder conversation
  const builderConvo = useConversation();
  const [builderProvider, setBuilderProvider] = useState<AIProvider>("claude");
  const [builderModel, setBuilderModel] = useState("claude-opus-4-20250514");
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

  // Width calculations: left=Architect, center=Builder, right=Runway
  const getWidths = () => {
    const visible = [showArchitect, showBuilder, showRunway].filter(Boolean).length;
    if (visible === 3) {
      if (activePane === "architect") return { left: "35%", center: "30%", right: "35%" };
      if (activePane === "builder") return { left: "25%", center: "40%", right: "35%" };
      return { left: "30%", center: "30%", right: "40%" };
    }
    if (visible === 2) {
      if (showArchitect && showBuilder) return { left: "50%", center: "50%", right: "0%" };
      if (showArchitect && showRunway) return { left: "40%", center: "0%", right: "60%" };
      if (showBuilder && showRunway) return { left: "0%", center: "40%", right: "60%" };
    }
    return { left: showArchitect ? "100%" : "0%", center: showBuilder ? "100%" : "0%", right: showRunway ? "100%" : "0%" };
  };

  const widths = getWidths();

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
      <div className="flex flex-1 overflow-hidden" style={{ flexDirection: reversed ? "row-reverse" : "row" }}>
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
            transition: "width 0.3s ease",
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

        {/* CENTER: Builder */}
        {showBuilder && (
        <div
          className={`ide-pane ${activePane === "architect" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "builder" ? "pane-flash" : ""}`}
          style={{
            width: widths.center,
            borderLeft: "1px solid rgba(9,8,14,0.08)",
            borderRight: "1px solid rgba(9,8,14,0.08)",
            overflow: "hidden",
            transition: "width 0.3s ease",
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

        {/* RIGHT: Staging Runway (with Files, Preview, Git tabs) */}
        {showRunway && (
        <div
          style={{
            width: widths.right,
            transition: "width 0.3s ease",
            borderRight:
              activePane === "builder"
                ? "3px solid #14287D"
                : "3px solid transparent",
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
