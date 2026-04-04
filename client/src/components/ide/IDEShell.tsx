import React, { useState, useCallback, useEffect, useRef } from "react";
import type {
  ActivePane,
  AIProvider,
  ConversationMessage,
  ProjectFile,
  Prototype,
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

type PaneKey = "architect" | "builder" | "runway";

const PANE_CONFIG: Record<PaneKey, { label: string; color: string }> = {
  architect: { label: "Architect", color: "#043B40" },
  builder:   { label: "Builder",   color: "#520322" },
  runway:    { label: "Runway",    color: "#00203A" },
};

function ColDragHandle({
  paneKey,
  colOrder,
  onDragStart,
  onDrop,
}: {
  paneKey: PaneKey;
  colOrder: PaneKey[];
  onDragStart: (idx: number) => void;
  onDrop: (idx: number) => void;
}) {
  const { color } = PANE_CONFIG[paneKey];
  return (
    <div
      draggable
      onDragStart={() => onDragStart(colOrder.indexOf(paneKey))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(colOrder.indexOf(paneKey))}
      title="Drag to reorder column"
      style={{
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        cursor: "grab",
        flexShrink: 0,
        background: "transparent",
        borderBottom: `1px solid ${color}22`,
        userSelect: "none",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: color, opacity: 0.25 }} />
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: color, opacity: 0.25 }} />
        </div>
      ))}
    </div>
  );
}

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

  // Layout preset
  type LayoutPreset = "full" | "prototype" | "staging" | "preview";
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("full");

  // Visibility
  const [showArchitect, setShowArchitect] = useState(true);
  const [showBuilder, setShowBuilder] = useState(true);
  const [showRunway, setShowRunway] = useState(true);

  // Runway display mode: architect ideation vs builder construction
  const [runwayMode, setRunwayMode] = useState<"architect" | "builder">("architect");
  const [runwayAutoSwitch, setRunwayAutoSwitch] = useState(true);

  // Column order — draggable
  const [colOrder, setColOrder] = useState<PaneKey[]>(["architect", "builder", "runway"]);

  const isVisible = useCallback(
    (k: PaneKey) =>
      k === "architect" ? showArchitect : k === "builder" ? showBuilder : showRunway,
    [showArchitect, showBuilder, showRunway]
  );

  const setVisible = useCallback((k: PaneKey, v: boolean) => {
    if (k === "architect") setShowArchitect(v);
    else if (k === "builder") setShowBuilder(v);
    else setShowRunway(v);
  }, []);

  // Apply layout presets
  const applyPreset = useCallback((preset: LayoutPreset) => {
    setLayoutPreset(preset);
    switch (preset) {
      case "full":       setShowArchitect(true);  setShowBuilder(true);  setShowRunway(true);  break;
      case "prototype":  setShowArchitect(true);  setShowBuilder(false); setShowRunway(true);  setRunwayMode("architect"); break;
      case "staging":    setShowArchitect(false); setShowBuilder(true);  setShowRunway(true);  setRunwayMode("builder"); break;
      case "preview":    setShowArchitect(false); setShowBuilder(false); setShowRunway(true);  break;
    }
  }, []);

  // Conversations
  const architectConvo = useConversation();
  const [architectProvider, setArchitectProvider] = useState<AIProvider>(
    (defaultArchitectConfig?.provider as AIProvider) ?? "claude"
  );
  const [architectModel, setArchitectModel] = useState(
    defaultArchitectConfig?.model ?? "claude-opus-4-20250514"
  );

  const builderConvo = useConversation();
  const [builderProvider, setBuilderProvider] = useState<AIProvider>(
    (defaultBuilderConfig?.provider as AIProvider) ?? "claude"
  );
  const [builderModel, setBuilderModel] = useState(
    defaultBuilderConfig?.model ?? "claude-opus-4-20250514"
  );
  const [builderInput, setBuilderInput] = useState("");
  const [architectInput, setArchitectInput] = useState("");

  const [newStagedIds, setNewStagedIds] = useState<Set<string>>(new Set());
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  // Prototype state
  const [currentPrototype, setCurrentPrototype] = useState<Prototype | null>(null);
  const [prototypeVersion, setPrototypeVersion] = useState(1);

  useEffect(() => { staging.loadChanges(projectId); }, [projectId]);
  useEffect(() => {
    architectConvo.loadConversations(projectId);
    builderConvo.loadConversations(projectId);
  }, [projectId]);

  // Load approved prototype on mount
  useEffect(() => {
    (async () => {
      try {
        const { api } = await import("../../lib/api");
        const proto = await api.fetch<Prototype | null>(`/api/prototypes/${projectId}/latest`);
        if (proto) {
          setCurrentPrototype(proto);
          setPrototypeVersion(proto.version);
        }
      } catch { /* no prototype yet */ }
    })();
  }, [projectId]);

  // Auto-switch runway mode based on who's streaming
  useEffect(() => {
    if (!runwayAutoSwitch) return;
    if (architectConvo.isStreaming) setRunwayMode("architect");
    else if (builderConvo.isStreaming) setRunwayMode("builder");
  }, [architectConvo.isStreaming, builderConvo.isStreaming, runwayAutoSwitch]);

  const handleRunwayToggle = useCallback((mode: "architect" | "builder") => {
    setRunwayMode(mode);
    setRunwayAutoSwitch(false);
  }, []);

  // ── Resizable columns ──────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const dragResizeRef = useRef<{
    handleIdx: number;
    startX: number;
    startWidths: Record<PaneKey, number>;
  } | null>(null);

  const [colWidths, setColWidths] = useState<Record<PaneKey, number>>({
    architect: 42,
    builder:   38,
    runway:    20,
  });

  // Reset widths when visibility changes
  useEffect(() => {
    const visible = (["architect", "builder", "runway"] as PaneKey[]).filter(
      k => k === "architect" ? showArchitect : k === "builder" ? showBuilder : showRunway
    );
    const n = visible.length;
    if (n === 0) return;
    if (n === 3) {
      setColWidths({ architect: 42, builder: 38, runway: 20 });
    } else if (n === 2) {
      const [a, b] = visible;
      const w: Record<PaneKey, number> = { architect: 0, builder: 0, runway: 0 };
      w[a] = 55; w[b] = 45;
      setColWidths(w);
    } else {
      const [only] = visible;
      const w: Record<PaneKey, number> = { architect: 0, builder: 0, runway: 0 };
      w[only] = 100;
      setColWidths(w);
    }
  }, [showArchitect, showBuilder, showRunway]);

  // Visible panes in current order — also kept in a ref for mousemove closure
  const visibleInOrder = colOrder.filter(isVisible);
  const visibleOrderRef = useRef<PaneKey[]>(visibleInOrder);
  visibleOrderRef.current = visibleInOrder;

  const handleResizeStart = useCallback((handleIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    dragResizeRef.current = { handleIdx, startX: e.clientX, startWidths: { ...colWidths } };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [colWidths]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragResizeRef.current;
      if (!drag || !containerRef.current) return;
      const pct = ((e.clientX - drag.startX) / containerRef.current.offsetWidth) * 100;
      const vis  = visibleOrderRef.current;
      const lk   = vis[drag.handleIdx];
      const rk   = vis[drag.handleIdx + 1];
      if (!lk || !rk) return;
      const MIN  = 15;
      const sum  = drag.startWidths[lk] + drag.startWidths[rk];
      const newL = Math.max(MIN, Math.min(drag.startWidths[lk] + pct, sum - MIN));
      setColWidths(prev => ({ ...prev, [lk]: newL, [rk]: sum - newL }));
    };
    const onUp = () => {
      if (dragResizeRef.current) {
        dragResizeRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── Tab drag-to-reorder ────────────────────────────────────────────────────
  const dragTabIdx = useRef<number | null>(null);

  const handleTabDragStart = useCallback((orderIdx: number) => {
    dragTabIdx.current = orderIdx;
  }, []);

  const handleTabDrop = useCallback((orderIdx: number) => {
    if (dragTabIdx.current === null || dragTabIdx.current === orderIdx) return;
    setColOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragTabIdx.current!, 1);
      next.splice(orderIdx, 0, moved);
      return next;
    });
    dragTabIdx.current = null;
  }, []);

  // ── Handoff ────────────────────────────────────────────────────────────────
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
      setArchitectInput(content);
      setActivePane("architect");
      setFlashPane("architect");
      setHandoffDirection(null);
      setTimeout(() => setFlashPane(null), 400);
    }, 500);
  }, []);

  const handleApprovePrototype = useCallback(async (htmlContent: string, technicalSpec: string) => {
    const { api } = await import("../../lib/api");
    const proto = await api.fetch<Prototype>("/api/prototypes", {
      method: "POST",
      body: {
        projectId,
        conversationId: architectConvo.conversation?.id,
        htmlContent,
        technicalSpec,
        status: "approved",
      },
    });
    setCurrentPrototype(proto);
    setPrototypeVersion(proto.version);
  }, [projectId, architectConvo.conversation]);

  const handleIteratePrototype = useCallback(() => {
    setActivePane("architect");
  }, []);

  // ── Message handlers ───────────────────────────────────────────────────────
  const handleArchitectMessage = useCallback(async (content: string) => {
    let convo = architectConvo.conversation;
    if (!convo) convo = await architectConvo.createConversation(projectId, "architect", architectProvider, architectModel);
    await architectConvo.sendMessage(convo.id, content);
  }, [architectConvo, projectId, architectProvider, architectModel]);

  const handleBuilderMessage = useCallback(async (content: string) => {
    let convo = builderConvo.conversation;
    if (!convo) convo = await builderConvo.createConversation(projectId, "builder", builderProvider, builderModel);
    await builderConvo.sendMessage(convo.id, content, (ids) => {
      setNewStagedIds(prev => new Set([...prev, ...ids]));
      staging.loadChanges(projectId);
      setTimeout(() => setNewStagedIds(new Set()), 1000);
    });
  }, [builderConvo, projectId, builderProvider, builderModel, staging]);

  const handleCommit = useCallback(async (_message: string) => {
    await staging.commitChanges(projectId);
  }, [staging, projectId]);

  const handleSaveAsProposal = useCallback(async (filePath: string, content: string) => {
    const { api } = await import("../../lib/api");
    await api.fetch("/api/staging", {
      method: "POST",
      body: { projectId, filePath, proposedContent: content, proposedBy: "user" },
    });
    staging.loadChanges(projectId);
  }, [projectId, staging]);

  const architectMessages = (architectConvo.conversation?.messages ?? []) as ConversationMessage[];
  const builderMessages   = (builderConvo.conversation?.messages ?? []) as ConversationMessage[];

  // ── Tab bar split ──────────────────────────────────────────────────────────
  const activeTabs  = colOrder.filter(k => isVisible(k));
  const dormantTabs = colOrder.filter(k => !isVisible(k));

  const tabStyle = (k: PaneKey, dormant: boolean): React.CSSProperties => ({
    fontFamily:      "var(--font-label)",
    fontSize:        "9px",
    fontWeight:      600,
    color:           PANE_CONFIG[k].color,
    background:      "transparent",
    border:          `1px solid ${PANE_CONFIG[k].color}`,
    borderRadius:    "4px",
    padding:         "2px 8px",
    cursor:          dormant ? "pointer" : "grab",
    textTransform:   "uppercase",
    letterSpacing:   "0.05em",
    transition:      "all 0.15s",
    opacity:         dormant ? 0.28 : 1,
    userSelect:      "none",
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col ide-layout">
      <TopNav
        projectName={projectName}
        branch={branch}
        lastSaved={null}
        computeStatus={computeStatus}
        userName={user?.name ?? ""}
        onProjectNameChange={onProjectNameChange}
        onDeploy={() => {}}
      />
      <ComputeWarningBanner status={computeStatus} />

      {/* Layout controls bar */}
      <div
        className="flex items-center justify-between px-3 py-1 glass-bg"
        style={{ background: "#FFF5ED", borderBottom: "1px solid rgba(9,8,14,0.06)", minHeight: "28px" }}
      >
        <div className="flex items-center gap-1">
          {/* Active tabs — outline style, drag to reorder, click to hide */}
          {activeTabs.map((k) => {
            const orderIdx = colOrder.indexOf(k);
            return (
              <button
                key={k}
                draggable
                onDragStart={() => handleTabDragStart(orderIdx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleTabDrop(orderIdx)}
                onClick={() => setVisible(k, false)}
                title={`Click to hide · Drag to reorder`}
                style={tabStyle(k, false)}
              >
                {PANE_CONFIG[k].label}
              </button>
            );
          })}

        </div>

        <div className="flex items-center gap-2">
          {dormantTabs.length > 0 && (
            <>
              {dormantTabs.map((k) => (
                <button
                  key={k}
                  onClick={() => setVisible(k, true)}
                  title={`Click to show ${PANE_CONFIG[k].label}`}
                  style={tabStyle(k, true)}
                >
                  {PANE_CONFIG[k].label}
                </button>
              ))}
              <div style={{ width: "1px", height: "12px", background: "rgba(9,8,14,0.12)" }} />
            </>
          )}
          {([
            { key: "full"       as LayoutPreset, label: "Full IDE",   color: "rgba(9,8,14,0.5)" },
            { key: "prototype"  as LayoutPreset, label: "Prototype",  color: "#043B40" },
            { key: "staging"    as LayoutPreset, label: "Staging",    color: "#520322" },
            { key: "preview"    as LayoutPreset, label: "Preview",    color: "#00203A" },
          ]).map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="btn"
              style={{
                fontFamily: "var(--font-label)",
                fontSize:   "11px",
                color:      layoutPreset === p.key ? p.color : "rgba(9,8,14,0.35)",
                background: "transparent",
                border:     "none",
                cursor:     "pointer",
                fontWeight: layoutPreset === p.key ? 600 : 400,
                transition: "color 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic pane layout */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden ide-panel-container">
        {visibleInOrder.map((k, idx) => (
          <React.Fragment key={k}>
            {/* ── Architect ── */}
            {k === "architect" && (
              <div
                className={`ide-pane flex flex-col ${activePane === "builder" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "architect" ? "pane-flash" : ""}`}
                style={{
                  width:      `${colWidths.architect}%`,
                  borderLeft: activePane === "architect" ? `3px solid ${PANE_CONFIG.architect.color}` : "3px solid transparent",
                  overflow:   "hidden",
                  flexShrink: 0,
                }}
              >
                <ColDragHandle paneKey="architect" colOrder={colOrder} onDragStart={handleTabDragStart} onDrop={handleTabDrop} />
                <div className="flex flex-1 overflow-hidden">
                <TodoPanel projectId={projectId} />
                <div className="flex-1 overflow-hidden">
                  <ArchitectPane
                    isActive={activePane === "architect"}
                    messages={architectMessages}
                    isStreaming={architectConvo.isStreaming}
                    streamedText={architectConvo.streamedText}
                    provider={architectProvider}
                    model={architectModel}
                    inputValue={architectInput}
                    onProviderChange={setArchitectProvider}
                    onModelChange={setArchitectModel}
                    onSendMessage={handleArchitectMessage}
                    onHandToBuilder={handleHandToBuilder}
                    onFocus={() => setActivePane("architect")}
                    onInputChange={setArchitectInput}
                  />
                </div>
                </div>
              </div>
            )}

            {/* ── Builder ── */}
            {k === "builder" && (
              <div
                className={`ide-pane flex flex-col ${activePane === "architect" ? "ide-pane-inactive" : "ide-pane-active"} ${flashPane === "builder" ? "pane-flash" : ""}`}
                style={{ width: `${colWidths.builder}%`, overflow: "hidden", flexShrink: 0 }}
              >
                <ColDragHandle paneKey="builder" colOrder={colOrder} onDragStart={handleTabDragStart} onDrop={handleTabDrop} />
                <div className="flex-1 overflow-hidden">
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
            )}

            {/* ── Runway ── */}
            {k === "runway" && (
              <div
                className="ide-pane ide-pane-active flex flex-col"
                style={{
                  width:       `${colWidths.runway}%`,
                  borderRight: activePane === "builder" ? `3px solid ${PANE_CONFIG.runway.color}` : "3px solid transparent",
                  flexShrink:  0,
                }}
              >
                <ColDragHandle paneKey="runway" colOrder={colOrder} onDragStart={handleTabDragStart} onDrop={handleTabDrop} />
                <div className="flex-1 overflow-hidden">
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
                  onCollapse={() => setShowRunway(false)}
                  runwayMode={runwayMode}
                  onRunwayToggle={handleRunwayToggle}
                  architectMessages={architectMessages}
                  architectIsStreaming={architectConvo.isStreaming}
                  architectStreamedText={architectConvo.streamedText}
                  prototypeVersion={prototypeVersion}
                  prototypeStatus={currentPrototype?.status as "draft" | "approved" | "superseded" ?? "draft"}
                  onApprovePrototype={handleApprovePrototype}
                  onIteratePrototype={handleIteratePrototype}
                />
                </div>
              </div>
            )}

            {/* Resize handle after every pane except the last */}
            {idx < visibleInOrder.length - 1 && (
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(idx, e)}
                style={{ width: "5px", cursor: "col-resize", background: "transparent", position: "relative", flexShrink: 0, zIndex: 20 }}
              >
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: "2px",
                  width: "1px", background: "rgba(9,8,14,0.08)",
                  transition: "background 0.15s, width 0.15s",
                }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Handoff overlay */}
      {handoffDirection && (
        <div style={{
          position: "fixed", top: "50%",
          left: handoffDirection === "to-builder" ? "45%" : "15%",
          transform: "translate(-50%, -50%)", zIndex: 100, pointerEvents: "none",
        }}>
          <div style={{
            background: "var(--deep-blue)", color: "var(--cream)",
            padding: "8px 20px", borderRadius: "20px",
            fontFamily: "var(--font-label)", fontSize: "13px", fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
          }}>
            {handoffDirection === "to-builder"
              ? "📋 Handing plan to Builder →"
              : "← 🔍 Sending to Architect for review"}
          </div>
        </div>
      )}

      {computeStatus.level === "depleted" && (
        <ComputeDepletedModal
          onPurchase={(block) => { console.log("Purchase block:", block); }}
          onSaveAndWait={() => {}}
          resetDate="April 1, 2026"
        />
      )}

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
