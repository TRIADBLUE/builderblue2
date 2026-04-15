import EcosystemFooter from "../components/EcosystemFooter";

export default function About() {
  return (
    <div>
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px",
          fontFamily: "var(--font-content)",
          color: "var(--ide-text)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "36px",
            marginBottom: "32px",
          }}
        >
          About BUILDERBLUE2.COM
        </h1>

        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            Company Overview
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            BUILDERBLUE2.COM is part of the TRIADBLUE ecosystem, a family of platforms built to give
            small business owners the same digital capabilities that large enterprises take for
            granted. We build tools that work the way real business owners think — no jargon, no
            complexity, just results.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            Our Mission
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            We exist to close the gap between having a great business idea and having the technology
            to bring it to life. BUILDERBLUE2.COM puts AI-powered development tools in the hands of
            people who know their craft but need help building their digital presence. You describe
            what you want. We help you build it.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            The Ecosystem Vision
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            Every TRIADBLUE platform handles a different piece of the puzzle — hosting, payments,
            website auditing, business strategy, and now AI-powered development. Together they form a
            complete ecosystem where each platform strengthens the others, so you never have to
            stitch together disconnected tools from a dozen different vendors.
          </p>
        </section>
      </div>

      <EcosystemFooter />
    </div>
  );
}
