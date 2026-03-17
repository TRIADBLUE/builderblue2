import { Link } from "wouter";
import { Nav } from "../components/layout/nav";

/**
 * BuilderBlue².com rendered in QTEraType with exact brand specs:
 * - First letter of each word (B, B) at full size
 * - Remaining letters are uppercase but 20% smaller
 * - "Builder" + ".com" in #09080E, "Blue" in #0000FF
 * - ² is superscript
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
        <h1 className="flex flex-wrap items-center justify-center gap-3" style={{ fontFamily: "var(--font-heading)", fontWeight: "bold" }}>
          <span style={{ color: "var(--triad-black)", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>S</span>
            <span style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>TART BUILDING WITH</span>
          </span>
          <BrandText size="clamp(2rem, 5vw, 3.5rem)" />
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl text-lg"
          style={{ color: "var(--steel-blue)", opacity: 0.8, lineHeight: 1.7, fontFamily: "var(--font-content)" }}
        >
          The AI-powered IDE where Architect designs and Builder codes — side by side on a shared stage.
          Ship production apps with vibe coding that actually works.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <button
              className="rounded-md px-8 py-3 text-base transition-all hover:scale-105"
              style={{
                background: "var(--deep-blue)",
                color: "var(--cream)",
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

      {/* Three-panel preview */}
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div
          className="overflow-hidden rounded-xl"
          style={{
            border: "2px solid var(--steel-blue)",
            boxShadow: "0 0 60px rgba(166, 124, 75, 0.15), 0 0 120px rgba(166, 124, 75, 0.05)",
          }}
        >
          <div className="flex" style={{ height: "360px" }}>
            {/* Architect pane — cream bg, M PLUS Rounded 1c, deep-blue text, transparent bubbles w/ deep-blue outline */}
            <div
              className="flex flex-col p-4"
              style={{
                flex: "1 1 0%",
                background: "var(--cream)",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--deep-blue)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-label)",
                }}
              >
                Architect
              </span>
              <div
                className="rounded-lg p-3 mb-2"
                style={{
                  background: "transparent",
                  fontFamily: "var(--font-architect)",
                  fontSize: "12px",
                  color: "var(--deep-blue)",
                  border: "1px solid var(--deep-blue)",
                  borderRadius: "12px 12px 2px 12px",
                }}
              >
                Design a landing page with hero, features grid, and CTA section
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: "transparent",
                  fontFamily: "var(--font-architect)",
                  fontSize: "12px",
                  color: "var(--deep-blue)",
                  border: "1px solid var(--deep-blue)",
                  borderRadius: "12px 12px 12px 2px",
                  lineHeight: 1.5,
                }}
              >
                I'll architect a responsive layout with a full-bleed hero...
                <span className="streaming-cursor streaming-cursor-architect" />
              </div>
            </div>

            {/* Left runway strip */}
            <div
              style={{
                width: "8px",
                flexShrink: 0,
                background: "#C4A06A",
                boxShadow: "0 0 12px rgba(166, 124, 75, 0.4)",
              }}
            />

            {/* Runway — tan bg, SN Pro, triad-black text, transparent bubbles w/ triad-black outline */}
            <div
              className="flex flex-col p-4 runway"
              style={{
                flex: "1.4 1 0%",
                background: "var(--tan)",
                boxShadow: "0 -6px 24px rgba(166, 124, 75, 0.35), 0 4px 20px rgba(166, 124, 75, 0.25)",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--triad-black)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-label)",
                }}
              >
                Staging Runway
              </span>
              {/* Staged card */}
              <div
                className="rounded-md mb-2"
                style={{
                  background: "transparent",
                  border: "1px solid var(--triad-black)",
                  borderLeft: "3px solid var(--triad-black)",
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--triad-black)" }}>
                    src/pages/landing.tsx
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5"
                    style={{ fontFamily: "var(--font-label)", fontSize: "9px", background: "var(--triad-black)", color: "var(--cream)" }}
                  >
                    builder
                  </span>
                </div>
                <div className="px-3 pb-2" style={{ fontFamily: "var(--font-runway)", fontSize: "10px" }}>
                  <div style={{ color: "var(--triad-black)" }}>+ export default function Landing() {"{"}</div>
                  <div style={{ color: "var(--triad-black)" }}>+   return &lt;HeroSection /&gt;</div>
                  <div style={{ color: "var(--triad-black)", opacity: 0.5 }}>  ...</div>
                </div>
              </div>
              <div
                className="rounded-md"
                style={{
                  background: "transparent",
                  border: "1px solid var(--triad-black)",
                  borderLeft: "3px solid var(--triad-black)",
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--triad-black)" }}>
                    src/components/Hero.tsx
                  </span>
                  <span style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "var(--triad-black)", textTransform: "uppercase" }}>
                    approved
                  </span>
                </div>
              </div>
            </div>

            {/* Right runway strip */}
            <div
              style={{
                width: "8px",
                flexShrink: 0,
                background: "#C4A06A",
                boxShadow: "0 0 12px rgba(166, 124, 75, 0.4)",
              }}
            />

            {/* Builder pane — cream bg, Datatype, triad-black text, transparent bubbles w/ steel-blue outline */}
            <div
              className="flex flex-col p-4"
              style={{
                flex: "1 1 0%",
                background: "var(--cream)",
              }}
            >
              <span
                className="mb-3 text-xs font-bold uppercase"
                style={{
                  color: "var(--triad-black)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-label)",
                }}
              >
                Builder
              </span>
              <div
                className="rounded-lg p-3 mb-2"
                style={{
                  background: "transparent",
                  fontFamily: "var(--font-builder)",
                  fontSize: "12px",
                  color: "var(--triad-black)",
                  border: "1px solid var(--steel-blue)",
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
                  style={{ fontSize: "9px", background: "var(--steel-blue)", color: "var(--cream)", fontFamily: "var(--font-label)" }}
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
                  style={{ color: "var(--triad-black)", fontFamily: "var(--font-heading)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--steel-blue)", opacity: 0.7, lineHeight: 1.6, fontFamily: "var(--font-content)" }}
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
          src="/builderblue2_header.png"
          alt="BuilderBlue²"
          className="mx-auto mb-3"
          style={{ height: "20px", opacity: 0.5 }}
        />
        <p style={{ fontFamily: "var(--font-content)", fontSize: "12px", color: "var(--steel-blue)", opacity: 0.5 }}>
          A TRIADBLUE platform
        </p>
      </div>
    </div>
  );
}
