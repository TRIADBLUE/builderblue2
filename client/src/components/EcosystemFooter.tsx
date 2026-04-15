import { Link } from "wouter";

const platforms = [
  { name: "businessblueprint.io", url: "https://businessblueprint.io", tagline: "Get Assessed. Get Prescribed. Get Business." },
  { name: "swipesblue.com", url: "https://swipesblue.com", tagline: "Go Blue. Get Swiped. Get Paid." },
  { name: "hostsblue.com", url: "https://hostsblue.com", tagline: "Go Blue. Get Site. Go Live." },
  { name: "scansblue.com", url: "https://scansblue.com", tagline: "Go Blue. Get Scanned. Get Scored." },
  { name: "BUILDERBLUE2.COM", url: "https://builderblue2.com", tagline: "Go Blue. Get Vibed. Get Ahead.", current: true },
];

export default function EcosystemFooter() {
  return (
    <footer
      style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border-primary)",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h2
        title="Six Platforms. One Ecosystem. Go Blue."
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "40px",
          textTransform: "uppercase",
          color: "var(--ide-text)",
          margin: "0 0 24px 0",
        }}
      >
        TRIADBLUE.COM ECOSYSTEM
      </h2>

      <div style={{ marginBottom: "24px" }}>
        {platforms.map((p, i) => (
          <span key={p.name}>
            {i > 0 && (
              <span
                style={{
                  color: "var(--ide-text-muted)",
                  fontSize: "22px",
                  fontFamily: "var(--font-content)",
                  margin: "0 12px",
                }}
              >
                ·
              </span>
            )}
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.tagline}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "22px",
                color: p.current ? "var(--ide-text)" : "var(--ide-text-muted)",
                fontWeight: p.current ? 700 : 400,
                textDecoration: "none",
              }}
            >
              {p.name}
            </a>
          </span>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
        <Link
          href="/about"
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "14px",
            color: "var(--ide-text-muted)",
            textDecoration: "none",
          }}
        >
          About
        </Link>
        <Link
          href="/terms"
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "14px",
            color: "var(--ide-text-muted)",
            textDecoration: "none",
          }}
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          style={{
            fontFamily: "var(--font-content)",
            fontSize: "14px",
            color: "var(--ide-text-muted)",
            textDecoration: "none",
          }}
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
