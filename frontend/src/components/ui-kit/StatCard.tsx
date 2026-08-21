import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "high" | "medium" | "normal";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "border-l-primary",
    high: "border-l-risk-high",
    medium: "border-l-risk-medium",
    normal: "border-l-risk-normal",
  }[tone];

  return (
    <div className={cn("gov-panel border-l-4 p-3.5", toneClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-primary">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("gov-panel", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-table-head px-4 py-2.5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
