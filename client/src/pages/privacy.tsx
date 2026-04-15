import EcosystemFooter from "../components/EcosystemFooter";

export default function Privacy() {
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
          Privacy Policy
        </h1>

        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            Data Collection
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            We collect information you provide when creating an account, including your name and
            email address. We also collect usage data such as pages visited and features used to
            improve the platform experience.
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
            How We Use Your Data
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            Your data is used to operate and improve BUILDERBLUE2.COM, process transactions through
            swipesblue.com, and communicate important updates about your account. We do not sell your
            personal information to third parties.
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
            Cookies
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            We use essential cookies to maintain your session and authentication state. We do not use
            third-party tracking cookies. You can disable cookies in your browser settings, though
            this may affect platform functionality.
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
            Third-Party Services
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            BUILDERBLUE2.COM integrates with other platforms in the TRIADBLUE ecosystem, including
            swipesblue.com for payment processing. Each platform in the ecosystem maintains its own
            privacy practices consistent with this policy.
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
            Your Rights
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            You have the right to access, correct, or delete your personal data at any time. You may
            also request a copy of all data we hold about you. To exercise these rights, contact us
            through the platform or via email.
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
            Contact Us
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            If you have questions about this privacy policy or how your data is handled, reach out
            to us at TRIADBLUE.COM. We are committed to transparency and will respond to all
            inquiries promptly.
          </p>
        </section>
      </div>

      <EcosystemFooter />
    </div>
  );
}
