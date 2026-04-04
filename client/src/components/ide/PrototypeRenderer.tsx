import { useRef, useEffect } from "react";

interface PrototypeRendererProps {
  htmlContent: string;
  version: number;
  status: "draft" | "approved" | "superseded";
  onApprove: () => void;
  onIterate: () => void;
}

export function PrototypeRenderer({
  htmlContent,
  version,
  status,
  onApprove,
  onIterate,
}: PrototypeRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [htmlContent]);

  return (
    <div style={{ margin: "12px 0" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "rgba(4, 59, 64, 0.06)",
          borderRadius: "8px 8px 0 0",
          borderBottom: "1px solid rgba(4, 59, 64, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "10px",
              fontWeight: 700,
              color: "#043B40",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Prototype v{version}
          </span>
          {status === "approved" && (
            <span
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "9px",
                fontWeight: 600,
                color: "#fff",
                background: "#043B40",
                padding: "2px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Approved
            </span>
          )}
        </div>

        {status === "draft" && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onIterate}
              className="btn"
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "10px",
                fontWeight: 600,
                color: "#043B40",
                background: "transparent",
                border: "1px solid rgba(4, 59, 64, 0.3)",
                borderRadius: "4px",
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              Give Feedback
            </button>
            <button
              onClick={onApprove}
              className="btn"
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "10px",
                fontWeight: 600,
                color: "#E9ECF0",
                background: "#043B40",
                border: "none",
                borderRadius: "4px",
                padding: "4px 16px",
                cursor: "pointer",
              }}
            >
              Approve Prototype
            </button>
          </div>
        )}
      </div>

      {/* Sandboxed iframe */}
      <div
        style={{
          border: "1px solid rgba(4, 59, 64, 0.1)",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          style={{
            width: "100%",
            height: "600px",
            border: "none",
            display: "block",
          }}
          title={`Prototype v${version}`}
        />
      </div>
    </div>
  );
}
