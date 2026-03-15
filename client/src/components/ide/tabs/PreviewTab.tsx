import { useState } from "react";

interface PreviewTabProps {
  projectId: string;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PreviewTab({ projectId }: PreviewTabProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const previewUrl = `/api/ide/preview/${projectId}`;

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "#1a1a1a" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between border-b px-3 py-1.5"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <div className="flex gap-1">
          {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDevice(mode)}
              className="rounded px-2 py-0.5 text-xs capitalize"
              style={{
                fontFamily: "var(--font-runway)",
                background:
                  device === mode
                    ? "var(--steel-blue)"
                    : "transparent",
                color: "var(--cream)",
                border: device === mode ? "none" : "1px solid rgba(233, 236, 240, 0.2)",
                cursor: "pointer",
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded px-2 py-0.5 text-xs"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--cream)",
              background: "transparent",
              border: "1px solid rgba(233, 236, 240, 0.2)",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => window.open(previewUrl, "_blank")}
            className="rounded px-2 py-0.5 text-xs"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--cream)",
              background: "transparent",
              border: "1px solid rgba(233, 236, 240, 0.2)",
              cursor: "pointer",
            }}
          >
            Open in Tab
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            width: DEVICE_WIDTHS[device],
            maxWidth: "100%",
            height: "100%",
            borderColor: "rgba(233, 236, 240, 0.1)",
            transition: "width 300ms ease-in-out",
          }}
        >
          <iframe
            key={refreshKey}
            src={previewUrl}
            title="Project Preview"
            className="h-full w-full border-none"
            style={{ background: "white" }}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
