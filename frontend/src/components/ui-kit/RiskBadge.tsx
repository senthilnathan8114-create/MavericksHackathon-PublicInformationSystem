import type { RiskLevel } from "@/data/mockData";
import { cn } from "@/lib/utils";

const STYLES: Record<RiskLevel, string> = {
  HIGH: "bg-risk-high-bg text-risk-high border-risk-high/40",
  MEDIUM: "bg-risk-medium-bg text-risk-medium border-risk-medium/40",
  NORMAL: "bg-risk-normal-bg text-risk-normal border-risk-normal/40",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-block min-w-16 rounded-sm border px-2 py-0.5 text-center text-[11px] font-bold tracking-wide",
        STYLES[level],
      )}
    >
      {level}
    </span>
  );
}

export function StatusBadge({ label, tone = "NORMAL" }: { label: string; tone?: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
        STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}
