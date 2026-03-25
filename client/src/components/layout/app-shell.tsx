import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { Nav } from "./nav";
import { ComputeUsageMeter } from "../dashboard/ComputeUsageMeter";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#FFF5ED" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--deep-blue)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "#FFF5ED" }}>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      {/* Compute usage footer */}
      <div className="fixed bottom-4 left-4" style={{ zIndex: 50 }}>
        <ComputeUsageMeter />
      </div>
    </div>
  );
}
