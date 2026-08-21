import { cn } from "@/lib/utils";

export interface BarItem {
  label: string;
  value: number;
  sublabel?: string;
  tone?: "high" | "medium" | "normal" | "default";
}

const TONE: Record<string, string> = {
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  normal: "bg-risk-normal",
  default: "bg-primary",
};

export function BarChart({
  items,
  suffix = "",
  scaleMax,
}: {
  items: BarItem[];
  suffix?: string;
  scaleMax?: number;
}) {
  const max = scaleMax ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3">
          <span className="truncate text-xs font-semibold text-foreground" title={item.label}>
            {item.label}
          </span>
          <span className="h-4 w-full overflow-hidden rounded-sm bg-secondary">
            <span
              className={cn("block h-full", TONE[item.tone ?? "default"])}
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%` }}
            />
          </span>
          <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
            {item.value.toLocaleString("en-IN")}
            {suffix}
            {item.sublabel ? (
              <span className="block text-[10px] text-muted-foreground/80">{item.sublabel}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
