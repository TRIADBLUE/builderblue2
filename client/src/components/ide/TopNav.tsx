import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import type { ComputeStatus } from "@shared/types";
import { useAuth } from "../../hooks/useAuth";

interface TopNavProps {
  projectName: string;
  projectId?: string;
  branch: string;
  lastSaved: string | null;
  computeStatus: ComputeStatus;
  userName: string;
  userEmail?: string;
  avatarUrl?: string | null;
  onProjectNameChange: (name: string) => void;
  onDeploy: () => void;
}

export function TopNav({
  projectName,
  projectId,
  branch,
  lastSaved,
  computeStatus,
  userName,
  userEmail,
  avatarUrl,
  onProjectNameChange,
  onDeploy,
}: TopNavProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const computeColor =
    computeStatus.level === "normal"
      ? "#008060"
      : computeStatus.level === "warning"
        ? "#B8860B"
        : "var(--ruby-red)";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await logout();
    } catch {}
    setLocation("/");
  };

  const menuItemStyle = {
    display: "block" as const,
    width: "100%",
    textAlign: "left" as const,
    padding: "8px 14px",
    background: "transparent",
    border: "none",
    cursor: "pointer" as const,
    fontFamily: "var(--font-content)",
    fontSize: "12px",
    color: "#09080E",
    transition: "background 0.1s",
  };

  return (
    <nav
      className="flex h-12 items-center justify-between px-4"
      style={{
        background: "#FFF5ED",
        borderBottom: "1px solid rgba(9, 8, 14, 0.1)",
      }}
    >
      {/* Left — brand */}
      <div className="flex items-center">
        <img
          src="/builderblue2_header.png"
          alt="BuilderBlue²"
          className="h-7"
          style={{ height: "28px", cursor: "pointer" }}
          onClick={() => setLocation("/dashboard")}
        />
      </div>

      {/* Center — project info */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="border-none bg-transparent text-center outline-none"
          style={{
            fontFamily: "var(--font-architect)",
            fontSize: "14px",
            color: "var(--triad-black)",
            width: `${Math.max(projectName.length, 8) * 9}px`,
          }}
        />
        <span
          className="rounded-full px-2 py-0.5"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--triad-black)",
            background: "var(--steel-blue)",
          }}
        >
          {branch}
        </span>
        {lastSaved && (
          <span
            style={{
              fontFamily: "var(--font-builder)",
              fontSize: "11px",
              color: "var(--triad-black)",
              opacity: 0.4,
            }}
          >
            Saved {lastSaved}
          </span>
        )}
      </div>

      {/* Right — compute, deploy, avatar */}
      <div className="flex items-center gap-3">
        <span
          className="rounded-full px-2.5 py-1"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--triad-black)",
            border: `1px solid ${computeColor}`,
          }}
        >
          <span style={{ color: computeColor, fontWeight: 600 }}>
            {computeStatus.sessionsUsed}
          </span>{" "}
          / {computeStatus.sessionsAllowed} sessions
        </span>

        <button
          onClick={onDeploy}
          className="rounded px-3 py-1.5 text-xs font-bold transition-colors"
          style={{
            fontFamily: "var(--font-builder)",
            fontSize: "13px",
            background: "var(--deep-blue)",
            color: "#FFF5ED",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Deploy
        </button>

        {/* Avatar with dropdown menu */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden"
            style={{
              background: avatarUrl ? "transparent" : "var(--steel-blue)",
              fontFamily: "var(--font-builder)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#FFF5ED",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "220px",
                background: "#FFF5ED",
                border: "1px solid rgba(9,8,14,0.12)",
                borderRadius: "10px",
                boxShadow: "0 12px 40px rgba(9,8,14,0.15), 0 4px 12px rgba(9,8,14,0.08)",
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              {/* User info */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(9,8,14,0.06)" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: "bold", color: "#09080E" }}>
                  {userName}
                </div>
                {userEmail && (
                  <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)", marginTop: "2px" }}>
                    {userEmail}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div style={{ padding: "4px 0" }}>
                <button
                  onClick={() => { setShowMenu(false); setLocation("/dashboard"); }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Dashboard
                </button>
                {projectId && (
                  <button
                    onClick={() => { setShowMenu(false); setLocation(`/project/${projectId}/settings`); }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    Project Settings
                  </button>
                )}
                <button
                  onClick={() => { setShowMenu(false); /* TODO: account settings page */ }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Account Settings
                </button>
              </div>

              {/* Logout */}
              <div style={{ borderTop: "1px solid rgba(9,8,14,0.06)", padding: "4px 0" }}>
                <button
                  onClick={handleLogout}
                  style={{ ...menuItemStyle, color: "var(--ruby-red)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(130,50,60,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
