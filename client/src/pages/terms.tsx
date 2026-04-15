import EcosystemFooter from "../components/EcosystemFooter";

export default function Terms() {
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
          Terms of Service
        </h1>

        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            Acceptance of Terms
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            By accessing or using BUILDERBLUE2.COM, you agree to be bound by these Terms of Service
            and all applicable laws and regulations. If you do not agree with any part of these
            terms, you must not use the platform.
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
            User Accounts
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account. You must notify us immediately of any
            unauthorized use of your account or any other breach of security.
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
            Payment Terms
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            All payment processing for BUILDERBLUE2.COM is handled through swipesblue.com. By
            subscribing to a paid plan, you authorize recurring charges at the agreed-upon rate.
            Refund requests are evaluated on a case-by-case basis.
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
            Termination
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            We reserve the right to suspend or terminate your account at any time for conduct that
            violates these terms or is harmful to other users, us, or third parties. Upon
            termination, your right to access the platform ceases immediately.
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
            Limitation of Liability
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            BUILDERBLUE2.COM and TRIADBLUE shall not be liable for any indirect, incidental, or
            consequential damages arising from your use of the platform. Our total liability is
            limited to the amount you have paid us in the twelve months preceding the claim.
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
            Governing Law
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: "16px" }}>
            These terms are governed by and construed in accordance with the laws of the United
            States. Any disputes arising from these terms or your use of the platform shall be
            resolved in the appropriate courts of jurisdiction.
          </p>
        </section>
      </div>

      <EcosystemFooter />
    </div>
  );
}
