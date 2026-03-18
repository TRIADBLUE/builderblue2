import { Link, useLocation } from "wouter";
import { ComputeUsageMeter } from "../dashboard/ComputeUsageMeter";

interface SidebarLink {
  label: string;
  href: string;
}

const links: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside
      className="flex flex-col justify-between w-64 border-r min-h-[calc(100vh-4rem)]"
      style={{ borderColor: "rgba(74, 144, 217, 0.15)", background: "var(--cream, #F5F0EB)" }}
    >
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors`}
              style={{
                fontFamily: "var(--font-content)",
                background: isActive ? "rgba(74, 144, 217, 0.1)" : "transparent",
                color: isActive ? "var(--deep-blue)" : "var(--steel-blue)",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Compute usage at bottom of sidebar */}
      <div className="p-4">
        <ComputeUsageMeter />
      </div>
    </aside>
  );
}
