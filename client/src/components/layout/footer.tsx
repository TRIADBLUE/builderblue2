export function Footer() {
  return (
    <footer
      style={{
        background: "var(--triad-black)",
        color: "#E9ECF0",
        fontFamily: "var(--font-content)",
        padding: "48px 24px 32px",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          {/* Column 1 — BUILDERBLUE² identity */}
          <div>
            <img
              src="/builderblue2_header.png"
              alt="BUILDERBLUE²"
              style={{ height: 28, objectFit: "contain", marginBottom: 12 }}
            />
            <p className="text-sm" style={{ color: "#808080", lineHeight: 1.6 }}>
              AI-powered vibe coding. Architect plans it. Builder codes it. You approve it. The Runway launches it.
            </p>
          </div>

          {/* Column 2 — Product */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#808080",
                marginBottom: 16,
              }}
            >
              Product
            </h4>
            <div className="space-y-2" style={{ fontSize: "13px" }}>
              <p><a href="/auth" style={{ color: "#E9ECF0", textDecoration: "none" }}>Sign In</a></p>
              <p><a href="/auth" style={{ color: "#E9ECF0", textDecoration: "none" }}>Create Account</a></p>
            </div>
          </div>

          {/* Column 3 — Ecosystem */}
          <div>
            {/* TRIADBLUE.COM ECOSYSTEM — always first, always very large */}
            <div className="mb-6">
              <img
                src="/triadblue-ecosystem-logo.png"
                alt="TRIADBLUE.COM ECOSYSTEM"
                style={{ height: 40, objectFit: "contain" }}
              />
              <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                Six Platforms. One Ecosystem. Go Blue.
              </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "0.5px solid rgba(233,236,240,0.2)", marginBottom: 20 }} />

            {/* All platforms in fixed order */}
            <div className="space-y-4">

              {/* businessblueprint.io */}
              <div>
                <a href="https://businessblueprint.io" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/bb-header-logo.png"
                    alt="businessblueprint.io"
                    style={{ height: 22, objectFit: "contain" }}
                  />
                </a>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  Get Assessed. Get Prescribed. Get Business.
                </p>
              </div>

              {/* swipesblue.com */}
              <div>
                <a href="https://swipesblue.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/swipesblue_logo_image_and_text_as_url.png"
                    alt="swipesblue.com"
                    style={{ height: 22, objectFit: "contain" }}
                  />
                </a>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  Go Blue. Get Swiped. Get Paid.
                </p>
              </div>

              {/* hostsblue.com */}
              <div>
                <a href="https://hostsblue.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/hostsblue_logo_image_and_text_as_url.png"
                    alt="hostsblue.com"
                    style={{ height: 22, objectFit: "contain" }}
                  />
                </a>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  Go Blue. Get Site. Go Live.
                </p>
              </div>

              {/* scansblue.com */}
              <div>
                <a href="https://scansblue.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/scansblue_logo_image_and_text_as_url.png"
                    alt="scansblue.com"
                    style={{ height: 22, objectFit: "contain" }}
                  />
                </a>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  Go Blue. Get Scanned. Get Scored.
                </p>
              </div>

              {/* BUILDERBLUE².COM — featured, no link */}
              <div>
                <img
                  src="/builderblue2-logo-url.png"
                  alt="BUILDERBLUE².COM"
                  style={{ height: 32, objectFit: "contain" }}
                />
                <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
                  Go Blue. Get Vibed. Get Ahead.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Copyright */}
        <div
          className="mt-12 pt-6 text-center"
          style={{ borderTop: "1px solid rgba(233,236,240,0.1)" }}
        >
          <p style={{ fontSize: "11px", color: "#808080" }}>
            &copy; {new Date().getFullYear()} TRIADBLUE, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
