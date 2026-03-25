import { Link } from "wouter";
import { Nav } from "../components/layout/nav";
import { useState, useEffect, useRef } from "react";

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

const FILE_TREE = [
  { name: "src/", indent: 0, type: "folder" as const },
  { name: "components/", indent: 1, type: "folder" as const },
  { name: "Dashboard.tsx", indent: 2, type: "file" as const },
  { name: "Analytics.tsx", indent: 2, type: "file" as const },
  { name: "Sidebar.tsx", indent: 2, type: "file" as const },
  { name: "lib/", indent: 1, type: "folder" as const },
  { name: "auth.ts", indent: 2, type: "file" as const },
  { name: "api/", indent: 1, type: "folder" as const },
  { name: "billing.ts", indent: 2, type: "file" as const },
  { name: "routes.ts", indent: 2, type: "file" as const },
  { name: "package.json", indent: 0, type: "file" as const },
  { name: "tsconfig.json", indent: 0, type: "file" as const },
];

const GIT_LOG = [
  { hash: "a3f8d21", msg: "Add Dashboard component with metrics grid", time: "2m ago" },
  { hash: "b7e1c44", msg: "Implement JWT auth with refresh tokens", time: "4m ago" },
  { hash: "c9d2e55", msg: "Wire Stripe billing webhooks", time: "5m ago" },
  { hash: "d1a3f66", msg: "Initial project scaffold", time: "8m ago" },
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

/* ── Mouse parallax hook ───────────────────────────────────────────── */
function useMouseParallax(ref: React.RefObject<HTMLDivElement | null>, intensity = 8) {
  const [transform, setTransform] = useState("rotateX(3deg) rotateY(0deg)");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / rect.width) * intensity;
      const rotateX = ((centerY - e.clientY) / rect.height) * intensity + 2;
      setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    };

    const handleLeave = () => {
      setTransform("rotateX(3deg) rotateY(0deg)");
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, intensity]);

  return transform;
}

/* ── Scroll fade-in hook ───────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

type RightTab = "staging" | "files" | "preview" | "git";

export default function Landing() {
  const arch = useTypingEffect(ARCHITECT_MESSAGES, 1200);
  const build = useTypingEffect(BUILDER_MESSAGES, 800);
  const [stagedVisible, setStagedVisible] = useState(0);
  const [rightTab, setRightTab] = useState<RightTab>("staging");
  const demoRef = useRef<HTMLDivElement>(null);
  const demoTransform = useMouseParallax(demoRef, 6);
  const tagline = useScrollReveal();

  // Reveal staged files progressively
  useEffect(() => {
    if (stagedVisible >= STAGED_FILES.length) return;
    const timer = setTimeout(() => setStagedVisible((c) => c + 1), 2500);
    return () => clearTimeout(timer);
  }, [stagedVisible]);

  const rightTabStyle = (active: boolean) => ({
    fontFamily: "var(--font-runway)",
    fontSize: "9px",
    color: active ? "#FFF5ED" : "#09080E",
    background: active ? "#14287D" : "transparent",
    border: "none",
    borderRadius: "3px",
    padding: "2px 6px",
    cursor: "pointer" as const,
    transition: "all 0.15s",
  });

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

      {/* ── Live IDE Demo (3D) ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-20" style={{ perspective: "1400px", position: "relative" }}>
        {/* Background glow */}
        <div
          className="demo-glow"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            height: "80%",
            background: "radial-gradient(ellipse at center, rgba(20, 40, 125, 0.08) 0%, rgba(62, 128, 107, 0.06) 30%, rgba(130, 50, 60, 0.04) 50%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          ref={demoRef}
          className="overflow-hidden rounded-xl demo-idle demo-entrance"
          style={{
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(9,8,14,0.12)",
            boxShadow:
              "0 60px 120px rgba(9, 8, 14, 0.22), " +
              "0 30px 60px rgba(9, 8, 14, 0.14), " +
              "0 12px 24px rgba(9, 8, 14, 0.10), " +
              "0 0 0 1px rgba(9,8,14,0.05), " +
              "0 80px 100px -20px rgba(20, 40, 125, 0.10), " +
              "inset 0 1px 0 rgba(255,255,255,0.5)",
            background: "rgba(255, 245, 237, 0.65)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            transform: demoTransform,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Glass glare overlay */}
          <div
            className="glass-glare"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
              pointerEvents: "none",
              zIndex: 50,
              borderRadius: "inherit",
            }}
          />

          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(9,8,14,0.03)", borderBottom: "1px solid rgba(9,8,14,0.08)", position: "relative", zIndex: 1 }}>
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
          <div className="flex" style={{ height: "440px", position: "relative", zIndex: 1 }}>

            {/* ── LEFT: Architect ──────────────────────────────────────── */}
            <div className="flex flex-col" style={{ flex: "1 1 0%", background: "rgba(62, 128, 107, 0.04)", borderRight: "1px solid rgba(62, 128, 107, 0.12)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "#3E806B", textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
                        color: msg.role === "user" ? "#E9ECF0" : "#09080E",
                        background: msg.role === "user" ? "#3E806B" : "white",
                        borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {arch.isTyping && arch.visibleCount < ARCHITECT_MESSAGES.length && (
                  <div className={`max-w-[90%] ${ARCHITECT_MESSAGES[arch.visibleCount].role === "user" ? "ml-auto" : ""}`}>
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{
                        fontFamily: "var(--font-architect)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: ARCHITECT_MESSAGES[arch.visibleCount].role === "user" ? "#FFF5ED" : "#09080E",
                        background: ARCHITECT_MESSAGES[arch.visibleCount].role === "user" ? "#3E806B" : "white",
                        borderRadius: "10px 10px 10px 2px",
                      }}
                    >
                      {arch.currentText}
                      <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ background: "#3E806B" }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 pb-3">
                <div
                  className="rounded py-1.5 text-center"
                  style={{
                    fontFamily: "var(--font-architect)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#E9ECF0",
                    background: "#3E806B",
                    opacity: arch.visibleCount >= 3 ? 1 : 0.3,
                    transition: "opacity 0.5s",
                  }}
                >
                  Hand to Builder →
                </div>
              </div>
            </div>

            {/* ── CENTER: Builder ──────────────────────────────────────── */}
            <div className="flex flex-col" style={{ flex: "1 1 0%", background: "rgba(130, 50, 60, 0.04)", borderRight: "1px solid rgba(130, 50, 60, 0.12)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "#82323C", textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
                        color: msg.role === "system" ? "#82323C" : "#09080E",
                        background: msg.role === "system" ? "rgba(130,50,60,0.06)" : "white",
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
                        color: "#09080E",
                        background: "white",
                        borderRadius: "10px 10px 10px 2px",
                      }}
                    >
                      {build.currentText}
                      <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ background: "#82323C" }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 pb-3">
                <div
                  className="rounded py-1.5 text-center"
                  style={{
                    fontFamily: "var(--font-builder)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#FFF5ED",
                    background: "#82323C",
                    opacity: build.visibleCount >= 2 ? 1 : 0.3,
                    transition: "opacity 0.5s",
                  }}
                >
                  Staged to Runway →
                </div>
              </div>
            </div>

            {/* ── RIGHT: Staging Runway (with interactive tabs) ─────── */}
            <div className="flex flex-col" style={{ flex: "1.2 1 0%", background: "rgba(20, 40, 125, 0.04)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.08)" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "11px", fontWeight: 700, color: "#14287D", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Staging Runway
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setRightTab("staging")} style={rightTabStyle(rightTab === "staging")}>Staging</button>
                  <button onClick={() => setRightTab("files")} style={rightTabStyle(rightTab === "files")}>Files</button>
                  <button onClick={() => setRightTab("preview")} style={rightTabStyle(rightTab === "preview")}>Preview</button>
                  <button onClick={() => setRightTab("git")} style={rightTabStyle(rightTab === "git")}>Git</button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-3 space-y-2">

                {/* Staging tab */}
                {rightTab === "staging" && (
                  <>
                    {STAGED_FILES.slice(0, stagedVisible).map((file, i) => (
                      <div
                        key={i}
                        className="rounded-md px-3 py-2 staged-card-enter"
                        style={{
                          background: "rgba(9, 8, 14, 0.04)",
                          borderLeft: `3px solid ${file.status === "approved" ? "#008060" : file.status === "reviewing" ? "#D4A843" : "#14287D"}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "#09080E" }}>
                            {file.path}
                          </span>
                          <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: file.status === "approved" ? "#008060" : file.status === "reviewing" ? "#D4A843" : "#14287D", textTransform: "uppercase", fontWeight: 600 }}>
                            {file.status === "reviewing" ? "Architect reviewing..." : file.status}
                          </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "10px", color: "#008060" }}>{file.lines}</span>
                      </div>
                    ))}
                    {stagedVisible >= STAGED_FILES.length && (
                      <div
                        className="mt-4 rounded-md px-3 py-2 text-center staged-card-enter"
                        style={{
                          background: "rgba(0, 128, 96, 0.1)",
                          border: "1px solid rgba(0, 128, 96, 0.2)",
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "#008060", fontWeight: 600 }}>
                          First try. Just like the last 3,422,435 times. ;-)
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Files tab */}
                {rightTab === "files" && (
                  <div>
                    {FILE_TREE.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 py-0.5"
                        style={{ paddingLeft: `${item.indent * 16 + 4}px` }}
                      >
                        <span style={{ fontSize: "11px" }}>{item.type === "folder" ? "📁" : "📄"}</span>
                        <span style={{
                          fontFamily: "var(--font-runway)",
                          fontSize: "11px",
                          color: "#09080E",
                          fontWeight: item.type === "folder" ? 600 : 400,
                        }}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview tab */}
                {rightTab === "preview" && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div
                      className="w-full rounded-lg overflow-hidden"
                      style={{ border: "1px solid rgba(9,8,14,0.08)", background: "white" }}
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "rgba(9,8,14,0.03)", borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF5F57" }} />
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FEBD2E" }} />
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#27C840" }} />
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "8px", color: "var(--steel-blue)", marginLeft: "6px" }}>localhost:3000</span>
                      </div>
                      <div className="p-4">
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "bold", color: "#09080E", marginBottom: "8px" }}>Dashboard</div>
                        <div className="flex gap-3 mb-3">
                          {[{ label: "Users", val: "1,247" }, { label: "Revenue", val: "$34.2k" }, { label: "Active", val: "89%" }].map((m, i) => (
                            <div key={i} className="flex-1 rounded-md p-2" style={{ background: "rgba(9,8,14,0.03)" }}>
                              <div style={{ fontFamily: "var(--font-content)", fontSize: "9px", color: "var(--steel-blue)" }}>{m.label}</div>
                              <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "bold", color: "#09080E" }}>{m.val}</div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-md" style={{ height: "60px", background: "linear-gradient(135deg, rgba(62,128,107,0.1), rgba(20,40,125,0.1))" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Git tab */}
                {rightTab === "git" && (
                  <div className="space-y-1.5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5" style={{ fontFamily: "var(--font-runway)", fontSize: "10px", fontWeight: 600, color: "#FFF5ED", background: "#14287D" }}>main</span>
                      <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)" }}>4 commits</span>
                    </div>
                    {GIT_LOG.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5" style={{ background: "rgba(9,8,14,0.03)" }}>
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "10px", color: "#14287D", fontWeight: 600, flexShrink: 0 }}>{c.hash}</span>
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "10px", color: "#09080E", flex: 1 }}>{c.msg}</span>
                        <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)", flexShrink: 0 }}>{c.time}</span>
                      </div>
                    ))}
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
                    background: stagedVisible >= 3 ? "#14287D" : "rgba(20,40,125,0.3)",
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

        {/* Floor shadow / reflection */}
        <div
          className="mx-auto"
          style={{
            width: "85%",
            height: "40px",
            marginTop: "-8px",
            background: "radial-gradient(ellipse at center, rgba(9,8,14,0.08) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* ── Tagline (scroll reveal) ──────────────────────────────────── */}
      <div
        ref={tagline.ref}
        className="mx-auto max-w-3xl px-4 pb-20 text-center"
        style={{
          opacity: tagline.visible ? 1 : 0,
          transform: tagline.visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <p style={{ fontFamily: "var(--font-content)", fontSize: "20px", color: "var(--steel-blue)", lineHeight: 1.8 }}>
          <strong style={{ color: "#3E806B" }}>Architect</strong> plans it.{" "}
          <strong style={{ color: "#82323C" }}>Builder</strong> codes it.{" "}
          <strong style={{ color: "#09080E" }}>You</strong> approve it.{" "}
          <span style={{ color: "#14287D", fontWeight: 600 }}>The Runway launches it.</span>
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
        .staged-card-enter {
          animation: fadeSlideIn 0.4s ease-out;
        }
        @keyframes idleFloat {
          0%, 100% { transform: rotateX(3deg) rotateY(0deg) translateY(0px); }
          25% { transform: rotateX(2.5deg) rotateY(0.5deg) translateY(-4px); }
          50% { transform: rotateX(3.5deg) rotateY(-0.3deg) translateY(-2px); }
          75% { transform: rotateX(2.8deg) rotateY(0.2deg) translateY(-5px); }
        }
        .demo-idle {
          animation: idleFloat 8s ease-in-out infinite;
        }
        .demo-idle:hover {
          animation: none;
        }
        @keyframes demoEntrance {
          from { opacity: 0; transform: rotateX(8deg) translateY(60px) scale(0.95); }
          to { opacity: 1; transform: rotateX(3deg) translateY(0) scale(1); }
        }
        .demo-entrance {
          animation: demoEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .demo-glow {
          animation: glowPulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
