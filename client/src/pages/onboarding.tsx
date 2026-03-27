import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import type { BusinessIndustry, PrimaryGoal, PublicUser } from "@shared/types";

const INDUSTRIES: { id: BusinessIndustry; label: string; icon: string }[] = [
  { id: "restaurant", label: "Restaurant or Food Service", icon: "🍽" },
  { id: "retail", label: "Retail or Shop", icon: "🛍" },
  { id: "professional-services", label: "Professional Services", icon: "💼" },
  { id: "construction", label: "Construction or Trades", icon: "🔨" },
  { id: "health-wellness", label: "Health & Wellness", icon: "❤" },
  { id: "home-services", label: "Home Services", icon: "🏠" },
  { id: "automotive", label: "Automotive", icon: "🚗" },
  { id: "real-estate", label: "Real Estate", icon: "🏢" },
  { id: "creative-agency", label: "Creative or Agency", icon: "🎨" },
  { id: "other", label: "Something Else", icon: "✦" },
];

const GOALS: { id: PrimaryGoal; label: string; description: string }[] = [
  { id: "get-found-online", label: "Get found online", description: "Show up when people search for businesses like yours" },
  { id: "sell-products", label: "Sell products online", description: "Set up a store where customers can browse and buy" },
  { id: "book-appointments", label: "Let customers book appointments", description: "Give people a way to schedule time with you" },
  { id: "showcase-portfolio", label: "Showcase my work", description: "A portfolio or gallery to show what you do" },
  { id: "build-internal-tool", label: "Build a tool for my team", description: "Something internal that helps your business run better" },
  { id: "launch-saas", label: "Launch a software product", description: "Build an app or service other people will pay for" },
  { id: "other", label: "Not sure yet", description: "We will help you figure it out as we go" },
];

export default function Onboarding() {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [industry, setIndustry] = useState<BusinessIndustry | null>(null);
  const [goal, setGoal] = useState<PrimaryGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
    if (user?.onboardingCompletedAt) setLocation("/dashboard");
  }, [isAuthenticated, user, setLocation]);

  const handleIndustrySelect = (id: BusinessIndustry) => {
    setIndustry(id);
    setStep(2);
  };

  const handleGoalSelect = async (id: PrimaryGoal) => {
    setGoal(id);
    setSaving(true);
    setError(null);
    try {
      const updated = await api.fetch<PublicUser>("/api/auth/onboarding", {
        method: "PATCH",
        body: { businessIndustry: industry, primaryGoal: id },
      });
      updateUser(updated);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--cream, #E9ECF0)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "#14287D",
            }}
          />
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: step >= 2 ? "#14287D" : "rgba(9,8,14,0.15)",
              transition: "background 0.3s",
            }}
          />
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading, Georgia)",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--triad-black, #09080E)",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              What kind of business do you run?
            </h1>
            <p
              style={{
                fontFamily: "var(--font-content, sans-serif)",
                fontSize: "15px",
                color: "rgba(9,8,14,0.6)",
                textAlign: "center",
                marginBottom: "32px",
              }}
            >
              This helps us suggest the right starting point for your project.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => handleIndustrySelect(ind.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    background: "#fff",
                    border: "1px solid rgba(9,8,14,0.1)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: "var(--font-content, sans-serif)",
                    fontSize: "14px",
                    color: "var(--triad-black, #09080E)",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#14287D";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(20,40,125,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(9,8,14,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{ind.icon}</span>
                  {ind.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              style={{
                fontFamily: "var(--font-label, monospace)",
                fontSize: "12px",
                color: "rgba(9,8,14,0.45)",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginBottom: "16px",
              }}
            >
              ← Back
            </button>
            <h1
              style={{
                fontFamily: "var(--font-heading, Georgia)",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--triad-black, #09080E)",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              What do you want to build first?
            </h1>
            <p
              style={{
                fontFamily: "var(--font-content, sans-serif)",
                fontSize: "15px",
                color: "rgba(9,8,14,0.6)",
                textAlign: "center",
                marginBottom: "32px",
              }}
            >
              Pick the one that matters most right now. You can always change direction later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGoalSelect(g.id)}
                  disabled={saving}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 20px",
                    background: "#fff",
                    border: "1px solid rgba(9,8,14,0.1)",
                    borderRadius: "10px",
                    cursor: saving ? "wait" : "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.borderColor = "#14287D";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(20,40,125,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(9,8,14,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-content, sans-serif)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--triad-black, #09080E)",
                    }}
                  >
                    {g.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-content, sans-serif)",
                      fontSize: "13px",
                      color: "rgba(9,8,14,0.5)",
                      marginTop: "4px",
                    }}
                  >
                    {g.description}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <p style={{ color: "#82323C", fontSize: "13px", textAlign: "center", marginTop: "16px" }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
