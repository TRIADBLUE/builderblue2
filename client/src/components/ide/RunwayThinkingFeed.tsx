import { useState, useEffect, useRef } from "react";

interface RunwayThinkingFeedProps {
  isActive: boolean;
  role: "architect" | "builder";
}

const ARCHITECT_ACTIONS = [
  "🧠 Processing your request...",
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
  "🧠 Processing your request...",
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

const ROLE_CONFIG = {
  architect: {
    actions: ARCHITECT_ACTIONS,
    color: "#043B40",
    label: "ARCHITECT IS THINKING",
  },
  builder: {
    actions: BUILDER_ACTIONS,
    color: "#520322",
    label: "BUILDER IS WORKING",
  },
};

export function RunwayThinkingFeed({ isActive, role }: RunwayThinkingFeedProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [fadeOut, setFadeOut] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const config = ROLE_CONFIG[role];

  // Cycle through actions, building up the feed
  useEffect(() => {
    if (!isActive) {
      if (lines.length > 0) {
        setFadeOut(true);
        const timer = setTimeout(() => {
          setLines([]);
          setFadeOut(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
      return;
    }

    setFadeOut(false);
    // Start with first action immediately
    setLines([config.actions[0]]);
    let index = 1;

    const interval = setInterval(() => {
      const action = config.actions[index % config.actions.length];
      setLines((prev) => [...prev, action]);
      index++;
    }, 2800);

    return () => clearInterval(interval);
  }, [isActive, role]);

  // Auto-scroll to bottom
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  if (lines.length === 0) return null;

  return (
    <div
      className="flex h-full flex-col"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(0, 255, 65, 0.1)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: config.color,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontVariant: "small-caps",
          }}
        >
          {config.label}
        </span>
        {/* Thin pulsing progress bar */}
        <div
          style={{
            marginTop: "8px",
            height: "2px",
            borderRadius: "1px",
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
            animation: "thinking-pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: "16px" }}
      >
        {lines.map((line, i) => {
          const isNewest = i === lines.length - 1;
          return (
            <div
              key={`${i}-${line}`}
              className="animate-fade-in"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "14px",
                color: "#00FF41",
                opacity: isNewest ? 1 : 0.5,
                textShadow: isNewest ? "0 0 8px rgba(0, 255, 65, 0.3)" : "none",
                marginBottom: "12px",
                transition: "opacity 300ms ease",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
