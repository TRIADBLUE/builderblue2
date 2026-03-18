import { useState, useEffect } from "react";

type AIRole = "architect" | "builder" | "reviewer";

interface ThinkingIndicatorProps {
  role: AIRole;
  isActive: boolean;
  /** Optional context like file path or component name for specificity */
  context?: string;
}

// ─── Real-time action verbs with emojis ─────────────────────────────────────

const ARCHITECT_ACTIONS = [
  "🧩 Mapping component hierarchy...",
  "📐 Evaluating layout strategies...",
  "🔍 Analyzing route dependencies...",
  "🏗️ Structuring project architecture...",
  "📋 Cross-referencing style guide...",
  "🧠 Processing design patterns...",
  "⚙️ Resolving configuration...",
  "🗺️ Charting navigation flow...",
  "📊 Estimating complexity...",
  "🎯 Aligning with project memory...",
  "🔗 Linking shared modules...",
  "📝 Drafting implementation plan...",
];

const BUILDER_ACTIONS = [
  "⚡ Generating TypeScript...",
  "🔧 Wiring up components...",
  "📦 Importing dependencies...",
  "🎨 Applying responsive styles...",
  "🔌 Connecting API endpoint...",
  "🧱 Scaffolding file structure...",
  "💾 Formatting with conventions...",
  "🛠️ Building utility functions...",
  "🧪 Adding error handling...",
  "🔄 Setting up state management...",
  "📡 Configuring data fetching...",
  "✍️ Writing clean code...",
];

const REVIEWER_ACTIONS = [
  "🔎 Scanning for type errors...",
  "✅ Checking accessibility patterns...",
  "🛡️ Verifying error boundaries...",
  "📏 Validating naming conventions...",
  "🧹 Reviewing code cleanliness...",
  "🔐 Checking security patterns...",
  "📐 Verifying against original plan...",
  "⚖️ Assessing performance impact...",
  "🔗 Tracing import chains...",
  "🎯 Confirming style guide compliance...",
];

// Rare easter eggs (data-backed confidence, always positive)
const EASTER_EGGS = [
  "✨ First try. Just like the last 3,422,435 times. ;-)",
  "🎯 Zero errors. Again. ;-)",
  "⚡ Reviewed in 0.3 seconds. Your move. ;-)",
  "🏆 That's 847 consecutive clean builds. But who's counting. ;-)",
  "💎 Flawless. As expected. ;-)",
  "🚀 Shipped faster than you can blink. ;-)",
];

const ACTION_MAP: Record<AIRole, string[]> = {
  architect: ARCHITECT_ACTIONS,
  builder: BUILDER_ACTIONS,
  reviewer: REVIEWER_ACTIONS,
};

export function ThinkingIndicator({ role, isActive, context }: ThinkingIndicatorProps) {
  const [currentAction, setCurrentAction] = useState("");
  const [dots, setDots] = useState("");

  // Cycle through actions while active
  useEffect(() => {
    if (!isActive) {
      setCurrentAction("");
      return;
    }

    const actions = ACTION_MAP[role];
    let index = Math.floor(Math.random() * actions.length);

    // Set initial action
    const action = context
      ? actions[index].replace("...", ` ${context}...`)
      : actions[index];
    setCurrentAction(action);

    const interval = setInterval(() => {
      index = (index + 1) % actions.length;
      const nextAction = context
        ? actions[index].replace("...", ` ${context}...`)
        : actions[index];
      setCurrentAction(nextAction);
    }, 2800);

    return () => clearInterval(interval);
  }, [isActive, role, context]);

  // Animated dots
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive || !currentAction) return null;

  const colors: Record<AIRole, string> = {
    architect: "var(--steel-blue)",
    builder: "var(--deep-blue)",
    reviewer: "var(--tan)",
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 animate-fade-in"
      style={{ opacity: 0.9 }}
    >
      {/* Pulsing dot */}
      <div
        className="thinking-pulse"
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: colors[role],
        }}
      />
      <span
        style={{
          fontFamily: role === "architect" ? "var(--font-architect)" : "var(--font-builder)",
          fontSize: "12px",
          color: "var(--steel-blue)",
          fontStyle: "italic",
        }}
      >
        {currentAction}
      </span>
    </div>
  );
}

/** Returns a random easter egg (call sparingly — e.g. on first-try approvals) */
export function getEasterEgg(): string {
  return EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
}
