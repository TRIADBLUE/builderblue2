import { Link } from "wouter";
import { useAuth } from "../../hooks/useAuth";

export function Nav() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav
      className="border-b"
      style={{
        background: "var(--cream)",
        borderColor: "var(--steel-blue)",
        borderBottomWidth: "2px",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <img
                src="/builderblue2_url.png"
                alt="BuilderBlue²"
                style={{ height: "36px" }}
              />
            </Link>

            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm transition-colors"
                  style={{ color: "var(--triad-black)", opacity: 0.7, fontFamily: "var(--font-builder)" }}
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm" style={{ color: "var(--triad-black)", opacity: 0.5 }}>
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="rounded px-3 py-1.5 text-sm transition-colors"
                  style={{
                    color: "var(--triad-black)",
                    background: "transparent",
                    border: "1px solid var(--steel-blue)",
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button
                    className="rounded px-3 py-1.5 text-sm transition-colors"
                    style={{
                      color: "var(--triad-black)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-builder)",
                    }}
                  >
                    Log in
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    className="rounded px-4 py-1.5 text-sm font-semibold transition-colors"
                    style={{
                      color: "var(--cream)",
                      background: "var(--pure-blue)",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-builder)",
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
