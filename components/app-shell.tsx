"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Dashboard", pill: "Live" },
  { href: "/results", label: "Incidents", pill: "RCA" },
  { href: "/resolution", label: "Runbooks", pill: "5 steps" },
  { href: "/resolved", label: "Memory", pill: "Qdrant" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const envLabel = process.env.NEXT_PUBLIC_APP_ENV || "Hackathon demo";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <span className="brand-eyebrow">PayZen Incident Ops</span>
          <strong className="brand-title">ZeroMTTR</strong>
          <span className="brand-subtitle">
            AI-powered incident RCA for UPI checkout reliability
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                className={cn("sidebar-link", active && "is-active")}
                href={item.href}
                key={item.href}
              >
                <span>{item.label}</span>
                <span className="sidebar-pill">{item.pill}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <strong>Judging flow ready</strong>
          <span>
            Sequential agent orchestration, RCA memory retrieval, and resolution
            playbook in one polished demo.
          </span>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-copy">
            <small>ZeroMTTR / PayZen</small>
            <strong>Incident control room</strong>
          </div>

          <div className="topbar-meta">
            <span className="env-badge">{envLabel}</span>
            <span className="badge badge-red">P1 ready</span>
          </div>
        </header>

        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
