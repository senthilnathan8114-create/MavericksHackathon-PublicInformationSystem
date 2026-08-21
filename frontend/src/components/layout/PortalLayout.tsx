import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Table2,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Survey Management", to: "/eSigma", icon: ClipboardList },
  { label: "Records", to: "/records", icon: Table2 },
  { label: "Enumerators", to: "/enumerators", icon: Users },
  { label: "Validation", to: "/dashboard", icon: ShieldCheck },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Reports", to: "/reports", icon: FileText },
] as const;

export function PortalLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="bg-header text-header-foreground">
        <div className="border-b border-header-accent/40 px-4 py-1 text-[11px] tracking-wide text-header-foreground/70">
          Prototype Environment — Statistical Survey Operations
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle navigation"
              className="rounded-sm border border-header-accent/40 p-1.5 md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-header-accent text-sm font-bold text-primary-foreground">
              IS
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-header-accent">
                eSIGMA Simulation
              </div>
              <div className="text-base font-bold sm:text-lg">
                IntelliSurvey
                <span className="hidden font-normal text-header-foreground/70 sm:inline">
                  {" "}
                  — Intelligent Survey Data Validation Platform
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-sm border border-header-accent/40 px-3 py-1.5">
              <span className="text-header-foreground/60">Survey: </span>
              <span className="font-semibold">PLFS</span>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-header-accent/40 px-3 py-1.5">
              <span className="text-header-foreground/60">System Status:</span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-risk-normal" />
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "w-60 shrink-0 bg-sidebar text-sidebar-foreground md:block",
            open ? "block" : "hidden",
          )}
        >
          <nav className="sticky top-0 py-3">
            <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
              Navigation
            </div>
            <ul>
              {NAV.map((item) => {
                const active = pathname.toLowerCase() === item.to.toLowerCase();
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 border-l-2 px-4 py-2.5 text-[13px] transition-colors",
                        active
                          ? "border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                          : "border-transparent hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">{children}</main>
      </div>

      <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
        Prototype — Not an official Government application
      </footer>
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
