import { Link } from "wouter";
import { Nav } from "../components/layout/nav";
import { useState, useEffect } from "react";

/**
 * BuilderBlue².com rendered in QTEraType with exact brand specs
 */
function BrandText({ size }: { size: string }) {
  const full = size;
  const small = `calc(${size} * 0.8)`;
  const sup = `calc(${size} * 0.5)`;
  return (
    <span style={{ fontFamily: "var(--font-heading)", fontWeight: "bold", whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
      <span style={{ fontSize: full, color: "#09080E" }}>B</span>
      <span style={{ fontSize: small, color: "#09080E" }}>UILDER</span>
      <span style={{ fontSize: full, color: "#0000FF" }}>B</span>
      <span style={{ fontSize: small, color: "#0000FF" }}>LUE</span>
      <sup style={{ fontSize: sup, color: "#09080E", verticalAlign: "super", lineHeight: 0 }}>2</sup>
      <span style={{ fontSize: small, color: "#09080E" }}>.COM</span>
    </span>
  );
}

/* ── Animated typing for the demo ──────────────────────────────────── */

const ARCHITECT_MESSAGES = [
  { role: "user" as const, text: "Build a SaaS dashboard with auth, billing, and analytics" },
  { role: "ai" as const, text: "Mapping component hierarchy..." },
  { role: "ai" as const, text: "I'll architect a modular layout: sidebar nav, top metrics row, chart grid, and a settings drawer. Auth via JWT with refresh tokens. Billing through Stripe webhooks." },
];

const BUILDER_MESSAGES = [
  { role: "system" as const, text: "Received plan from Architect" },
  { role: "ai" as const, text: "Writing src/components/Dashboard.tsx..." },
  { role: "ai" as const, text: "Generating 247 lines of TypeScript..." },
  { role: "ai" as const, text: "Wiring up 3 API endpoints..." },
];

const STAGED_FILES = [
  { path: "src/components/Dashboard.tsx", lines: "+247", status: "reviewing" as const },
  { path: "src/lib/auth.ts", lines: "+89", status: "approved" as const },
  { path: "src/api/billing.ts", lines: "+134", status: "approved" as const },
  { path: "src/components/Analytics.tsx", lines: "+156", status: "pending" as const },
];

function useTypingEffect(messages: { role: string; text: string }[], delay: number) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visibleCount >= messages.length) return;

    const msg = messages[visibleCount];
    let charIndex = 0;
    setIsTyping(true);
    setCurrentText("");

    const typeInterval = setInterval(() => {
      charIndex++;
      setCurrentText(msg.text.slice(0, charIndex));
      if (charIndex >= msg.text.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => setVisibleCount((c) => c + 1), delay);
      }
    }, 18);

    return () => clearInterval(typeInterval);
  }, [visibleCount, messages, delay]);

  return { visibleCount, currentText, isTyping };
}

export default function Landing() {
  const arch = useTypingEffect(ARCHITECT_MESSAGES, 1200);
  const build = useTypingEffect(BUILDER_MESSAGES, 800);
  const [stagedVisible, setStagedVisible] = useState(0);

  // Reveal staged files progressively
  useEffect(() => {
    if (stagedVisible >= STAGED_FILES.length) return;
    const timer = setTimeout(() => setStagedVisible((c) => c + 1), 2500);
    return () => clearTimeout(timer);
  }, [stagedVisible]);

  return (
    <div className="min-h-screen" style={{ background: "#FFF5ED" }}>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-6 text-center">
        <img
          src="/builderblue2_logo.png"
          alt="BuilderBlue²"
          className="mx-auto mb-6"
          style={{ height: "90px" }}
        />
        <h1 className="flex flex-wrap items-center justify-center gap-3" style={{ fontFamily: "var(--font-heading)", fontWeight: "bold" }}>
          <span style={{ color: "var(--triad-black)", whiteSpace: "nowrap", fontFamily: "var(--font-heading)", fontWeight: "bold", letterSpacing: "0.06em" }}>
            <span style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>S</span>
            <span style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>TART</span>
            {" "}
            <span style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>B</span>
            <span style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>UILDING</span>
            {" "}
            <span style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>W</span>
            <span style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>ITH</span>
          </span>
          <BrandText size="clamp(2rem, 5vw, 3.5rem)" />
        </h1>
        <p
          className="mx-auto mt-4 max-w-xl"
          style={{ color: "var(--steel-blue)", fontSize: "17px", lineHeight: 1.7, fontFamily: "var(--font-content)" }}
        >
          Two AIs. One stage. Ship it.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/register">
            <button
              className="rounded-md px-8 py-3 text-base transition-all hover:scale-105"
              style={{
                background: "var(--deep-blue)",
                color: "#FFF5ED",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-button)",
                fontWeight: 600,
              }}
            >
              Start building free
            </button>
          </Link>
          <Link href="/login">
            <button
              className="rounded-md px-8 py-3 text-base transition-all"
              style={{
                background: "transparent",
                color: "var(--deep-blue)",
                border: "1px solid var(--deep-blue)",
                cursor: "pointer",
                fontFamily: "var(--font-button)",
                fontWeight: 600,
              }}
            >
              Sign in
            </button>
          </Link>
        </div>
      </div>

      {/* ── Live IDE Demo ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-20">
        <div
          className="overflow-hidden rounded-xl"
          style={{
            border: "1px solid rgba(9,8,14,0.12)",
            boxShadow: "0 20px 80px rgba(166, 124, 75, 0.12), 0 4px 20px rgba(0,0,0,0.06)",
            background: "#FFF5ED",
          }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(9,8,14,0.03)", borderBottom: "1px solid rgba(9,8,14,0.08)" }}>
            <div className="flex gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C840" }} />
            </div>
            <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--steel-blue)", marginLeft: "12px" }}>
              builderblue2.com — My SaaS App
            </span>
          </div>

          {/* Three columns */}
          <div className="flex" style={{ height: "420px" }}>

            {/* ── LEFT: Architect ──────────────────────────────────────── */}
            <div className="flex flex-col" style={{ flex: "1 1 0%", background: "#FFF5ED", borderRight: "1px solid rgba(9,8,14,0.08)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "var(--deep-blue)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Architect
                </span>
                <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)" }}>Claude Opus 4</span>
              </div>
              <div className="flex-1 overflow-hidden p-3 space-y-2">
                {ARCHITECT_MESSAGES.slice(0, arch.visibleCount).map((msg, i) => (
                  <div key={i} className={`max-w-[90%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        fontFamily: "var(--font-architect)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: msg.role === "user" ? "#FFF5ED" : "var(--triad-black)",
                        background: msg.role === "user" ? "var(--steel-blue)" : "white",
                        borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {arch.isTyping && arch.visibleCount < ARCHITECT_MESSAGES.length && (
                  <div className="max-w-[90%]">
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        fontFamily: "var(--font-architect)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: ARCHITECT_MESSAGES[arch.visibleCount].role === "user" ? "#FFF5ED" : "var(--triad-black)",
                        background: ARCHITECT_MESSAGES[arch.visibleCount].role === "user" ? "var(--steel-blue)" : "white",
                        borderRadius: "10px 10px 10px 2px",
                      }}
                    >
                      {arch.currentText}
                      <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ background: "var(--deep-blue)" }} />
                    </div>
                  </div>
                )}
              </div>
              {/* Handoff indicator */}
              <div className="px-3 pb-3">
                <div
                  className="rounded py-1.5 text-center"
                  style={{
                    fontFamily: "var(--font-architect)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#FFF5ED",
                    background: "var(--steel-blue)",
                    opacity: arch.visibleCount >= 3 ? 1 : 0.3,
                    transition: "opacity 0.5s",
                  }}
                >
                  Hand to Builder →
                </div>
              </div>
            </div>

            {/* ── CENTER: Builder ──────────────────────────────────────── */}
            <div className="flex flex-col" style={{ flex: "1 1 0%", background: "#FFF5ED", borderRight: "1px solid rgba(9,8,14,0.08)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "var(--triad-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Builder
                </span>
                <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)" }}>Claude Opus 4</span>
              </div>
              <div className="flex-1 overflow-hidden p-3 space-y-2">
                {BUILDER_MESSAGES.slice(0, build.visibleCount).map((msg, i) => (
                  <div key={i} className="max-w-[90%]">
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        fontFamily: "var(--font-builder)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: msg.role === "system" ? "var(--steel-blue)" : "var(--triad-black)",
                        background: msg.role === "system" ? "rgba(31,88,130,0.08)" : "white",
                        borderRadius: "10px 10px 10px 2px",
                        fontStyle: msg.role === "system" ? "italic" : "normal",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {build.isTyping && build.visibleCount < BUILDER_MESSAGES.length && (
                  <div className="max-w-[90%]">
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        fontFamily: "var(--font-builder)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "var(--triad-black)",
                        background: "white",
                        borderRadius: "10px 10px 10px 2px",
                      }}
                    >
                      {build.currentText}
                      <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ background: "var(--triad-black)" }} />
                    </div>
                  </div>
                )}
              </div>
              {/* Staged indicator */}
              <div className="px-3 pb-3">
                <div
                  className="rounded py-1.5 text-center"
                  style={{
                    fontFamily: "var(--font-builder)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#FFF5ED",
                    background: "var(--deep-blue)",
                    opacity: build.visibleCount >= 2 ? 1 : 0.3,
                    transition: "opacity 0.5s",
                  }}
                >
                  Staged to Runway →
                </div>
              </div>
            </div>

            {/* ── RIGHT: Visual / Files / Preview ─────────────────────── */}
            <div className="flex flex-col" style={{ flex: "1.2 1 0%", background: "#A67C4B" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.15)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "#FFF5ED", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Staging Runway
                </span>
                <div className="flex gap-2">
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "#FFF5ED", opacity: 0.6 }}>Files</span>
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "#FFF5ED", opacity: 0.6 }}>Preview</span>
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "#FFF5ED", opacity: 0.6 }}>Git</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-3 space-y-2">
                {STAGED_FILES.slice(0, stagedVisible).map((file, i) => (
                  <div
                    key={i}
                    className="rounded-md px-3 py-2"
                    style={{
                      background: "#D0B799",
                      borderLeft: `3px solid ${file.status === "approved" ? "#008060" : file.status === "reviewing" ? "#D4A843" : "var(--steel-blue)"}`,
                      animation: "fadeSlideIn 0.4s ease-out",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--triad-black)" }}>
                        {file.path}
                      </span>
                      <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: file.status === "approved" ? "#008060" : file.status === "reviewing" ? "#D4A843" : "var(--steel-blue)", textTransform: "uppercase", fontWeight: 600 }}>
                        {file.status === "reviewing" ? "Architect reviewing..." : file.status}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-runway)", fontSize: "10px", color: "#008060" }}>{file.lines}</span>
                  </div>
                ))}
                {stagedVisible >= STAGED_FILES.length && (
                  <div
                    className="mt-4 rounded-md px-3 py-2 text-center"
                    style={{
                      background: "rgba(0, 128, 96, 0.15)",
                      border: "1px solid rgba(0, 128, 96, 0.3)",
                      animation: "fadeSlideIn 0.4s ease-out",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "#008060", fontWeight: 600 }}>
                      First try. Just like the last 3,422,435 times. ;-)
                    </span>
                  </div>
                )}
              </div>
              {/* Commit button */}
              <div className="px-3 pb-3">
                <div
                  className="rounded py-2 text-center"
                  style={{
                    fontFamily: "var(--font-button)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FFF5ED",
                    background: stagedVisible >= 3 ? "#008060" : "rgba(0,128,96,0.3)",
                    transition: "all 0.5s",
                    letterSpacing: "0.03em",
                  }}
                >
                  Commit & Deploy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── One line. That's it. ───────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 pb-20 text-center">
        <p style={{ fontFamily: "var(--font-content)", fontSize: "20px", color: "var(--steel-blue)", lineHeight: 1.8 }}>
          <strong style={{ color: "var(--triad-black)" }}>Architect</strong> plans it.{" "}
          <strong style={{ color: "var(--triad-black)" }}>Builder</strong> codes it.{" "}
          <strong style={{ color: "var(--triad-black)" }}>You</strong> approve it.{" "}
          <span style={{ color: "#A67C4B" }}>The Runway ships it.</span>
        </p>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="py-8 text-center" style={{ borderTop: "1px solid rgba(9,8,14,0.06)" }}>
        <img
          src="/builderblue2_header.png"
          alt="BuilderBlue²"
          className="mx-auto mb-3"
          style={{ height: "20px", opacity: 0.4 }}
        />
        <p style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", opacity: 0.4 }}>
          A TRIADBLUE platform
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
