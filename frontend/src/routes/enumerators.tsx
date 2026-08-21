import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { BarChart } from "@/components/ui-kit/BarChart";
import { RiskBadge } from "@/components/ui-kit/RiskBadge";
import { Panel, StatCard } from "@/components/ui-kit/StatCard";
import { enumeratorSummary, enumerators, topRiskEnumerators } from "@/data/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enumerators")({
  head: () => ({
    meta: [
      { title: "Enumerator Risk Analysis | IntelliSurvey" },
      {
        name: "description",
        content:
          "Field enumerator performance and anomaly rates for the PLFS survey round, highlighting high-risk enumerators for scrutiny.",
      },
      { property: "og:title", content: "Enumerator Risk Analysis" },
      {
        property: "og:description",
        content: "Anomaly rates and risk classification for PLFS field enumerators.",
      },
    ],
  }),
  component: EnumeratorsPage,
});

function EnumeratorsPage() {
  const rows = [...enumerators].sort((a, b) => b.anomaly_pct - a.anomaly_pct).slice(0, 60);

  return (
    <PortalLayout>
      <PageHeading
        title="Enumerator Risk Analysis"
        subtitle="Field staff performance patterns detected during validation"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enumerators" value={enumeratorSummary.total} />
        <StatCard label="High Risk" value={enumeratorSummary.high_risk} tone="high" />
        <StatCard label="Medium Risk" value={enumeratorSummary.medium_risk} tone="medium" />
        <StatCard label="Normal" value={enumeratorSummary.normal} tone="normal" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Enumerator Register" description="Sorted by anomaly percentage">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="sticky top-0">
                <tr className="bg-table-head text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  {[
                    "Enumerator ID",
                    "Region",
                    "Total Records",
                    "Anomalies",
                    "Anomaly %",
                    "Risk Level",
                  ].map((h) => (
                    <th key={h} className="border border-border px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.enumerator_id}
                    className={cn(
                      "odd:bg-card even:bg-secondary/40",
                      e.risk_level === "HIGH" && "bg-risk-high-bg even:bg-risk-high-bg",
                    )}
                  >
                    <td className="border border-border px-3 py-2 font-mono font-semibold">
                      {e.enumerator_id}
                    </td>
                    <td className="border border-border px-3 py-2">{e.region}</td>
                    <td className="border border-border px-3 py-2 tabular-nums">
                      {e.total_records}
                    </td>
                    <td className="border border-border px-3 py-2 tabular-nums">{e.anomalies}</td>
                    <td className="border border-border px-3 py-2 tabular-nums">
                      {e.anomaly_pct}%
                    </td>
                    <td className="border border-border px-3 py-2">
                      <RiskBadge level={e.risk_level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Anomaly % — Selected Enumerators" description="Top 10 by anomaly rate">
          <BarChart
            suffix="%"
            items={topRiskEnumerators.map((e) => ({
              label: e.enumerator_id,
              value: e.anomaly_pct,
              sublabel: e.region,
              tone: e.risk_level.toLowerCase() as "high" | "medium" | "normal",
            }))}
          />
        </Panel>
      </div>
    </PortalLayout>
  );
}
