import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import type { ProjectFile } from "@shared/types";

type DeployStep = "plan-select" | "building" | "deploying" | "complete" | "error";

interface DeployModalProps {
  projectId: string;
  projectName: string;
  files: ProjectFile[];
  onClose: () => void;
  onDeployComplete: (url: string) => void;
}

const HOSTSBLUE_PLANS = [
  {
    slug: "begin",
    name: "Begin",
    price: "$15/mo",
    priceMonthly: 1500,
    description: "Shared hosting — perfect for landing pages and simple apps",
    features: ["SSL included", "100 sites per server", "5GB storage"],
  },
  {
    slug: "build",
    name: "Build",
    price: "$29/mo",
    priceMonthly: 2900,
    description: "Shared premium — for apps with moderate traffic",
    features: ["SSL included", "50 sites per server", "15GB storage", "Daily backups"],
  },
  {
    slug: "scale",
    name: "Scale",
    price: "$99/mo",
    priceMonthly: 9900,
    description: "5 sites per server — for apps that need performance",
    features: ["SSL included", "5 sites per server", "50GB storage", "Daily backups", "CDN"],
  },
  {
    slug: "expand",
    name: "Expand",
    price: "$320/mo",
    priceMonthly: 32000,
    description: "Containerized VPS — for production SaaS and high-traffic apps",
    features: ["SSL included", "2 customers per server", "100GB storage", "Hourly backups", "CDN", "DDoS protection"],
  },
];

function getRecommendedPlan(files: ProjectFile[]): string {
  const hasServerDir = files.some((f) => f.path.startsWith("server/"));
  const hasSchema = files.some(
    (f) => f.path.includes("schema") || f.path.includes("migration") || f.path.includes("drizzle")
  );
  const hasPackageJson = files.some((f) => f.path === "package.json");
  const totalFiles = files.length;

  if (hasSchema || (hasServerDir && totalFiles > 100)) return "expand";
  if (hasServerDir) return "scale";
  if (hasPackageJson || totalFiles > 20) return "build";
  return "begin";
}

export function DeployModal({
  projectId,
  projectName,
  files,
  onClose,
  onDeployComplete,
}: DeployModalProps) {
  const [step, setStep] = useState<DeployStep>("plan-select");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [buildLog, setBuildLog] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recommendedPlan = getRecommendedPlan(files);

  // Check for existing deployment on mount
  useEffect(() => {
    api.fetch<{ status: string; deployedUrl?: string }>(`/api/deploy/${projectId}/status`)
      .then((res) => {
        if (res.status === "deployed" && res.deployedUrl) {
          setDeployedUrl(res.deployedUrl);
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollStatus = useCallback(
    (deploymentId: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.fetch<{
            status: string;
            deployedUrl?: string;
            buildLog?: string;
          }>(`/api/deploy/${projectId}/status`);

          if (status.buildLog) setBuildLog(status.buildLog);

          if (status.status === "building") {
            setStep("building");
          } else if (status.status === "deploying") {
            setStep("deploying");
          } else if (status.status === "deployed" && status.deployedUrl) {
            if (pollRef.current) clearInterval(pollRef.current);
            setDeployedUrl(status.deployedUrl);
            setStep("complete");
            onDeployComplete(status.deployedUrl);
          } else if (status.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setErrorMsg(status.buildLog || "Deployment failed");
            setStep("error");
          }
        } catch {
          // keep polling
        }
      }, 3000);
    },
    [projectId, onDeployComplete]
  );

  const handleDeploy = useCallback(async () => {
    if (!selectedPlan) return;
    setStep("building");
    setErrorMsg("");
    setBuildLog("Initiating deployment...");

    try {
      const result = await api.fetch<{ deploymentId: string }>(`/api/deploy/${projectId}`, {
        method: "POST",
        body: { target: "hostsblue", planSlug: selectedPlan },
      });
      pollStatus(result.deploymentId);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to start deployment");
      setStep("error");
    }
  }, [projectId, selectedPlan, pollStatus]);

  const handleExportZip = useCallback(async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

      const res = await globalThis.fetch(`/api/deploy/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ target: "export" }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to export project");
      setStep("error");
    }
  }, [projectId, projectName]);

  const planCardStyle = (slug: string) => {
    const isSelected = selectedPlan === slug;
    const isRecommended = recommendedPlan === slug;
    return {
      flex: 1,
      minWidth: "200px",
      padding: "20px",
      borderRadius: "10px",
      border: isSelected
        ? "2px solid #064A6C"
        : isRecommended
          ? "2px solid rgba(6, 74, 108, 0.4)"
          : "1px solid rgba(74,144,217,0.2)",
      background: isSelected ? "rgba(6, 74, 108, 0.04)" : "white",
      cursor: "pointer" as const,
      transition: "all 0.15s",
      position: "relative" as const,
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(9, 8, 14, 0.5)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FFF5ED",
          borderRadius: "14px",
          width: "90%",
          maxWidth: step === "plan-select" ? "900px" : "500px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(9,8,14,0.25)",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "20px",
              fontWeight: "bold",
              color: "var(--triad-black)",
              margin: 0,
            }}
          >
            {step === "plan-select" && "Deploy to hostsblue.com"}
            {step === "building" && "Building..."}
            {step === "deploying" && "Deploying..."}
            {step === "complete" && "Deployed"}
            {step === "error" && "Deployment Failed"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--steel-blue)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Plan Selection */}
        {step === "plan-select" && (
          <>
            {deployedUrl && (
              <div
                className="mb-4 rounded-lg px-4 py-3"
                style={{
                  background: "rgba(0, 128, 96, 0.06)",
                  border: "1px solid rgba(0, 128, 96, 0.2)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-content)",
                    fontSize: "13px",
                    color: "#008060",
                  }}
                >
                  Currently live at{" "}
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#008060", fontWeight: 600 }}
                  >
                    {deployedUrl}
                  </a>
                  {" "}— deploying again will update the live site.
                </span>
              </div>
            )}

            <p
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "13px",
                color: "var(--steel-blue)",
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              Choose a hosting plan. Your project will be live on hostsblue.com in seconds.
            </p>

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
            >
              {HOSTSBLUE_PLANS.map((plan) => (
                <div
                  key={plan.slug}
                  style={planCardStyle(plan.slug)}
                  onClick={() => setSelectedPlan(plan.slug)}
                >
                  {recommendedPlan === plan.slug && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#064A6C",
                        color: "#FFF5ED",
                        fontFamily: "var(--font-button)",
                        fontSize: "10px",
                        padding: "2px 10px",
                        borderRadius: "10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Recommended
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "var(--triad-black)",
                      marginBottom: "4px",
                    }}
                  >
                    {plan.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "22px",
                      fontWeight: "bold",
                      color: "#064A6C",
                      marginBottom: "8px",
                    }}
                  >
                    {plan.price}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-content)",
                      fontSize: "12px",
                      color: "var(--steel-blue)",
                      marginBottom: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          fontFamily: "var(--font-content)",
                          fontSize: "11px",
                          color: "var(--triad-black)",
                          padding: "2px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ color: "#008060", fontSize: "13px" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.slug && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#064A6C",
                        color: "#FFF5ED",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleDeploy}
                disabled={!selectedPlan}
                className="btn rounded-md px-6 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: selectedPlan ? "var(--deep-blue)" : "var(--steel-blue)",
                  color: "#FFF5ED",
                  border: "none",
                  cursor: selectedPlan ? "pointer" : "not-allowed",
                  opacity: selectedPlan ? 1 : 0.5,
                  fontFamily: "var(--font-button)",
                }}
              >
                Deploy to hostsblue.com
              </button>

              {selectedPlan && (
                <span
                  style={{
                    fontFamily: "var(--font-content)",
                    fontSize: "12px",
                    color: "var(--steel-blue)",
                  }}
                >
                  {HOSTSBLUE_PLANS.find((p) => p.slug === selectedPlan)?.name} —{" "}
                  {HOSTSBLUE_PLANS.find((p) => p.slug === selectedPlan)?.price}
                </span>
              )}
            </div>

            <button
              onClick={handleExportZip}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "12px",
                color: "var(--steel-blue)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                marginTop: "12px",
                display: "block",
              }}
            >
              or download project as ZIP
            </button>
          </>
        )}

        {/* Building / Deploying */}
        {(step === "building" || step === "deploying") && (
          <div className="flex flex-col items-center py-8">
            <div
              className="mb-4 h-10 w-10 animate-spin rounded-full"
              style={{ border: "3px solid rgba(6,74,108,0.15)", borderTopColor: "#064A6C" }}
            />
            <p
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "14px",
                color: "var(--triad-black)",
                marginBottom: "8px",
              }}
            >
              {step === "building" ? "Building your project..." : "Uploading to hostsblue.com..."}
            </p>
            {buildLog && (
              <p
                style={{
                  fontFamily: "var(--font-content)",
                  fontSize: "12px",
                  color: "var(--steel-blue)",
                }}
              >
                {buildLog}
              </p>
            )}
          </div>
        )}

        {/* Complete */}
        {step === "complete" && deployedUrl && (
          <div className="flex flex-col items-center py-8">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(0, 128, 96, 0.1)",
                color: "#008060",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "16px",
              }}
            >
              ✓
            </div>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "18px",
                fontWeight: "bold",
                color: "var(--triad-black)",
                marginBottom: "8px",
              }}
            >
              Your site is live
            </p>
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "15px",
                color: "#064A6C",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              {deployedUrl}
            </a>
            <button
              onClick={onClose}
              className="btn rounded-md px-6 py-2 text-sm font-semibold"
              style={{
                background: "var(--deep-blue)",
                color: "#FFF5ED",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-button)",
              }}
            >
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center py-8">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(200, 50, 50, 0.1)",
                color: "var(--ruby-red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "16px",
              }}
            >
              ×
            </div>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "16px",
                fontWeight: "bold",
                color: "var(--triad-black)",
                marginBottom: "8px",
              }}
            >
              Deployment failed
            </p>
            <p
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "13px",
                color: "var(--steel-blue)",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("plan-select");
                  setErrorMsg("");
                }}
                className="btn rounded-md px-5 py-2 text-sm font-semibold"
                style={{
                  background: "var(--deep-blue)",
                  color: "#FFF5ED",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm"
                style={{
                  background: "transparent",
                  color: "var(--steel-blue)",
                  border: "1px solid var(--steel-blue)",
                  cursor: "pointer",
                  fontFamily: "var(--font-button)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
