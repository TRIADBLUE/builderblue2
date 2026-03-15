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

  // Architect conversation
  const architectConvo = useConversation();
  const [architectProvider, setArchitectProvider] = useState<AIProvider>("claude");
  const [architectModel, setArchitectModel] = useState("claude-sonnet-4-20250514");

  // Builder conversation
  const builderConvo = useConversation();
  const [builderProvider, setBuilderProvider] = useState<AIProvider>("claude");
  const [builderModel, setBuilderModel] = useState("claude-sonnet-4-20250514");
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

  // Width calculations based on active pane
  const getWidths = () => {
    if (activePane === "architect") return { left: "35%", center: "40%", right: "25%" };
    if (activePane === "builder") return { left: "25%", center: "40%", right: "35%" };
    return { left: "30%", center: "40%", right: "30%" };
  };

  const widths = getWidths();

  // Hand-off handlers
  const handleHandToBuilder = useCallback((content: string) => {
    setBuilderInput(content);
    setActivePane("builder");
    setFlashPane("builder");
    setTimeout(() => setFlashPane(null), 300);
  }, []);

  const handleHandToArchitect = useCallback((content: string) => {
    // Put content into architect — for now, show it as context
    setActivePane("architect");
    setFlashPane("architect");
    setTimeout(() => setFlashPane(null), 300);
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
    <div className="flex h-screen flex-col">
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

      {/* Three panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Architect pane */}
        <div
          className={`ide-pane ${activePane === "builder" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "architect" ? "pane-flash" : ""}`}
          style={{
            width: widths.left,
            borderLeft:
              activePane === "architect"
                ? "3px solid var(--steel-blue)"
                : "3px solid transparent",
            overflow: "hidden",
          }}
        >
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

        {/* Center runway */}
        <div style={{ width: widths.center }} className="ide-pane ide-pane-active">
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
          />
        </div>

        {/* Builder pane */}
        <div
          className={`ide-pane ${activePane === "architect" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "builder" ? "pane-flash" : ""}`}
          style={{
            width: widths.right,
            borderRight:
              activePane === "builder"
                ? "3px solid var(--steel-blue)"
                : "3px solid transparent",
            overflow: "hidden",
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
      </div>

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
