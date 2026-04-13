import { useState, useEffect } from "react";

interface ServiceStatus {
  name: string;
  url: string;
  status: "online" | "offline" | "checking";
}

export function ServicesTab() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "TRIADBLUE", url: "TRIADBLUE.COM", status: "checking" },
    { name: "hostsblue", url: "hostsblue.com", status: "checking" },
    { name: "swipesblue", url: "swipesblue.com", status: "checking" },
    { name: "scansblue", url: "scansblue.com", status: "checking" },
    { name: "ConsoleBlue", url: "console.blue", status: "checking" },
    { name: "BuilderBlue²", url: "builderblue2.com", status: "online" },
  ]);

  useEffect(() => {
    // Simulate ping checks
    const timer = setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          status: s.name === "BuilderBlue²" ? "online" : "online",
        }))
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--triad-black)" }}
    >
      {/* TRIADBLUE Status */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <h3
          className="mb-3"
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: "12px",
            color: "#00FF41",
            opacity: 0.6,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          TRIADBLUE Ecosystem
        </h3>

        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      service.status === "online"
                        ? "#008060"
                        : service.status === "offline"
                          ? "var(--ruby-red)"
                          : "#B8860B",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Source Code Pro', monospace",
                    fontSize: "12px",
                    color: "#00FF41",
                  }}
                >
                  {service.name}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: "11px",
                  color: "#00FF41",
                  opacity: 0.3,
                }}
              >
                {service.url}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* HostsBlue Bridge */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <h3
          className="mb-3"
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: "12px",
            color: "#00FF41",
            opacity: 0.6,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          HostsBlue Bridge
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {["Domain Finder", "Hosting Manager", "SSL Manager", "Email Manager"].map(
            (tool) => (
              <button
                key={tool}
                className="rounded px-3 py-2 text-left text-xs transition-colors"
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  color: "#00FF41",
                  background: "rgba(0, 255, 65, 0.06)",
                  border: "1px solid rgba(233, 236, 240, 0.1)",
                  cursor: "pointer",
                }}
              >
                {tool}
              </button>
            )
          )}
        </div>
      </div>

      {/* SwipesBlue */}
      <div className="px-4 py-3">
        <h3
          className="mb-3"
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: "12px",
            color: "#00FF41",
            opacity: 0.6,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          SwipesBlue Payments
        </h3>

        <div
          className="rounded p-3"
          style={{
            background: "rgba(0, 255, 65, 0.06)",
            border: "1px solid rgba(0, 255, 65, 0.15)",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: "12px",
              color: "#00FF41",
            }}
          >
            <span>Payment Status</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ background: "#008060", color: "#09080E" }}
            >
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
