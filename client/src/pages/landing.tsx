import { Link } from "wouter";
import { Nav } from "../components/layout/nav";

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <Nav />

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 text-center">
        <img
          src="/builderblue2_logo.png"
          alt="BuilderBlue²"
          className="mx-auto mb-8"
          style={{ height: "120px" }}
        />
        <h1
          className="flex flex-wrap items-center justify-center gap-4 text-5xl font-bold tracking-tight sm:text-6xl"
          style={{ color: "var(--triad-black)", fontFamily: "var(--font-builder)" }}
        >
          Start building with{" "}
          <img
            src="/builderblue2_text.png"
            alt="BuilderBlue².com"
            style={{ height: "1.15em", verticalAlign: "middle" }}
          />
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl text-lg"
          style={{ color: "var(--steel-blue)", opacity: 0.8, lineHeight: 1.7, fontFamily: "var(--font-builder)" }}
        >
          The AI-powered IDE where Architect designs and Builder codes — side by side on a shared stage.
          Ship production apps with vibe coding that actually works.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <button
              className="rounded-md px-8 py-3 text-base font-bold transition-all hover:scale-105"
              style={{
                background: "var(--pure-blue)",
                color: "var(--cream)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-builder)",
              }}
            >
              Start building free
            </button>
          </Link>
          <Link href="/login">
            <button
              className="rounded-md px-8 py-3 text-base font-medium transition-all"
              style={{
                background: "transparent",
                color: "var(--steel-blue)",
                border: "1px solid var(--steel-blue)",
                cursor: "pointer",
                fontFamily: "var(--font-builder)",
              }}
            >
              Sign in
            </button>
          </Link>
        </div>
      </div>

      {/* Three-panel preview */}
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div
          className="overflow-hidden rounded-xl"
          style={{
            border: "2px solid var(--steel-blue)",
            boxShadow: "0 0 60px rgba(166, 124, 75, 0.15), 0 0 120px rgba(166, 124, 75, 0.05)",
          }}
        >
          <div className="relative flex" style={{ height: "360px" }}>
            {/* Architect pane */}
            <div
              className="flex flex-col p-4"
              style={{
                width: "30%",
                background: "var(--cream)",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--triad-black)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-architect)",
                }}
              >
                Architect
              </span>
              <div
                className="rounded-lg p-3 mb-2"
                style={{
                  background: "var(--steel-blue)",
                  fontFamily: "var(--font-architect)",
                  fontSize: "12px",
                  color: "var(--cream)",
                  borderRadius: "12px 12px 2px 12px",
                }}
              >
                Design a landing page with hero, features grid, and CTA section
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: "white",
                  fontFamily: "var(--font-architect)",
                  fontSize: "12px",
                  color: "var(--triad-black)",
                  borderRadius: "12px 12px 12px 2px",
                  lineHeight: 1.5,
                }}
              >
                I'll architect a responsive layout with a full-bleed hero...
                <span className="streaming-cursor streaming-cursor-architect" />
              </div>
            </div>

            {/* Left angled divider */}
            <svg
              style={{
                position: "absolute",
                left: "30%",
                top: 0,
                width: "20px",
                height: "100%",
                zIndex: 20,
                marginLeft: "-10px",
                filter: "drop-shadow(0 0 6px rgba(166, 124, 75, 0.3))",
              }}
              preserveAspectRatio="none"
              viewBox="0 0 20 360"
            >
              <polygon points="6,0 14,0 8,360 0,360" fill="#C4A06A" />
            </svg>

            {/* Runway */}
            <div
              className="flex flex-col p-4 runway"
              style={{
                width: "40%",
                background: "var(--tan)",
                zIndex: 10,
                boxShadow: "0 -6px 24px rgba(166, 124, 75, 0.35), 0 4px 20px rgba(166, 124, 75, 0.25)",
                position: "relative",
                marginTop: "-4px",
                marginBottom: "-4px",
                borderRadius: "4px",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--cream)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-runway)",
                }}
              >
                Staging Runway
              </span>
              {/* Staged card */}
              <div
                className="rounded-md mb-2"
                style={{
                  background: "var(--triad-black)",
                  border: "1px solid rgba(233, 236, 240, 0.2)",
                  borderLeft: "3px solid var(--steel-blue)",
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--cream)" }}>
                    src/pages/landing.tsx
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5"
                    style={{ fontFamily: "var(--font-runway)", fontSize: "9px", background: "var(--steel-blue)", color: "var(--cream)" }}
                  >
                    builder
                  </span>
                </div>
                <div className="px-3 pb-2" style={{ fontFamily: "var(--font-runway)", fontSize: "10px" }}>
                  <div style={{ color: "#008060" }}>+ export default function Landing() {"{"}</div>
                  <div style={{ color: "#008060" }}>+   return &lt;HeroSection /&gt;</div>
                  <div style={{ color: "var(--cream)", opacity: 0.5 }}>  ...</div>
                </div>
              </div>
              <div
                className="rounded-md"
                style={{
                  background: "var(--triad-black)",
                  border: "1px solid rgba(233, 236, 240, 0.2)",
                  borderLeft: "3px solid #008060",
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--cream)" }}>
                    src/components/Hero.tsx
                  </span>
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "#008060", textTransform: "uppercase" }}>
                    approved
                  </span>
                </div>
              </div>
            </div>

            {/* Right angled divider */}
            <svg
              style={{
                position: "absolute",
                left: "70%",
                top: 0,
                width: "20px",
                height: "100%",
                zIndex: 20,
                marginLeft: "-10px",
                filter: "drop-shadow(0 0 6px rgba(166, 124, 75, 0.3))",
              }}
              preserveAspectRatio="none"
              viewBox="0 0 20 360"
            >
              <polygon points="12,0 20,0 14,360 6,360" fill="#C4A06A" />
            </svg>

            {/* Builder pane */}
            <div
              className="flex flex-col p-4"
              style={{
                width: "30%",
                background: "var(--cream)",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--triad-black)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-builder)",
                }}
              >
                Builder
              </span>
              <div
                className="rounded-lg p-3 mb-2"
                style={{
                  background: "white",
                  fontFamily: "var(--font-builder)",
                  fontSize: "12px",
                  color: "var(--triad-black)",
                  borderRadius: "12px 12px 12px 2px",
                  lineHeight: 1.5,
                }}
              >
                <div
                  className="rounded p-2 mb-1"
                  style={{ background: "var(--triad-black)", fontFamily: "var(--font-runway)", fontSize: "10px", color: "var(--cream)" }}
                >
                  {"// filepath: src/pages/landing.tsx"}<br />
                  {"export default function Landing()..."}
                </div>
                <span
                  className="rounded px-1 py-0.5"
                  style={{ fontSize: "9px", background: "var(--steel-blue)", color: "var(--cream)" }}
                >
                  Staged →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div
        className="border-t py-20"
        style={{
          borderColor: "var(--steel-blue)",
          background: "var(--cream)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                title: "Architect + Builder",
                desc: "Two AI agents work in parallel. Architect designs, Builder implements. You approve what ships.",
              },
              {
                title: "The Staging Runway",
                desc: "Every code change lands on a shared stage. Review diffs, approve with one touch, commit when ready.",
              },
              {
                title: "Compute That Never Expires",
                desc: "Buy compute blocks once, use them whenever. No monthly burn. No wasted sessions.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg p-6" style={{ border: "1px solid var(--steel-blue)" }}>
                <h3
                  className="mb-2 text-base font-bold"
                  style={{ color: "var(--triad-black)", fontFamily: "var(--font-builder)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--steel-blue)", opacity: 0.7, lineHeight: 1.6, fontFamily: "var(--font-builder)" }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t py-8 text-center"
        style={{ borderColor: "var(--steel-blue)", opacity: 1 }}
      >
        <img
          src="/builderblue2_url.png"
          alt="BuilderBlue²"
          className="mx-auto mb-3"
          style={{ height: "20px", opacity: 0.5 }}
        />
        <p style={{ fontFamily: "var(--font-builder)", fontSize: "12px", color: "var(--steel-blue)", opacity: 0.5 }}>
          A TRIADBLUE platform
        </p>
      </div>
    </div>
  );
}
