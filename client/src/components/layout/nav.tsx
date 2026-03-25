import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export function Nav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { theme, cycleTheme } = useTheme();

  const themeIcon = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🔄";
  const themeLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

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
      className="border-b"
      style={{
        background: "#FFF5ED",
        borderColor: "rgba(9, 8, 14, 0.1)",
        borderBottomWidth: "1px",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center no-underline">
              <img
                src="/builderblue2_header.png"
                alt="BuilderBlue²"
                style={{ height: "32px" }}
              />
            </Link>

            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm transition-colors no-underline"
                  style={{ color: "#09080E", opacity: 0.6, fontFamily: "var(--font-button)", fontWeight: 600 }}
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden"
                  style={{
                    background: "var(--steel-blue)",
                    fontFamily: "var(--font-builder)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#FFF5ED",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {initials}
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
                        {user?.name || "User"}
                      </div>
                      {user?.email && (
                        <div style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "var(--steel-blue)", marginTop: "2px" }}>
                          {user.email}
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
                      <button
                        onClick={() => { setShowMenu(false); /* TODO: account settings */ }}
                        style={menuItemStyle}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        Account Settings
                      </button>
                    </div>

                    {/* Theme toggle */}
                    <div style={{ borderTop: "1px solid rgba(9,8,14,0.06)", padding: "4px 0" }}>
                      <button
                        onClick={() => { cycleTheme(); }}
                        style={menuItemStyle}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,8,14,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {themeIcon} Theme: {themeLabel}
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
            ) : (
              <>
                <Link href="/login">
                  <button
                    className="rounded px-3 py-1.5 text-sm transition-colors"
                    style={{
                      color: "var(--deep-blue)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-button)",
                      fontWeight: 600,
                    }}
                  >
                    Log in
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    className="rounded px-4 py-1.5 text-sm transition-colors"
                    style={{
                      color: "#FFF5ED",
                      background: "var(--deep-blue)",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-button)",
                      fontWeight: 600,
                    }}
                  >
                    Get started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
