import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { BarChart } from "@/components/ui-kit/BarChart";
import { Panel } from "@/components/ui-kit/StatCard";
import { regionStats, riskDistribution, topRiskEnumerators } from "@/data/mockData";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Survey Analytics — Regional & Risk Distribution | IntelliSurvey" },
      {
        name: "description",
        content:
          "Regional anomaly distribution, risk breakdown and top enumerator anomaly rates for the PLFS survey round.",
      },
      { property: "og:title", content: "Survey Analytics — IntelliSurvey" },
      {
        property: "og:description",
        content: "Regional, risk-level and enumerator anomaly analytics for PLFS.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <PortalLayout>
      <PageHeading
        title="Survey Analytics"
        subtitle="Aggregated validation statistics for the current PLFS round"
      />

      <div className="grid gap-4">
        <Panel
          title="1. Regional Anomaly Distribution"
          description="Records processed and anomalies detected by state"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="bg-table-head text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="border border-border px-3 py-2">Region</th>
                    <th className="border border-border px-3 py-2">Total Records</th>
                    <th className="border border-border px-3 py-2">Anomalies</th>
                    <th className="border border-border px-3 py-2">Anomaly %</th>
                  </tr>
                </thead>
                <tbody>
                  {regionStats.map((r) => (
                    <tr key={r.region} className="odd:bg-card even:bg-secondary/40">
                      <td className="border border-border px-3 py-2 font-semibold">{r.region}</td>
                      <td className="border border-border px-3 py-2 tabular-nums">
                        {r.total_records.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-border px-3 py-2 tabular-nums">{r.anomalies}</td>
                      <td className="border border-border px-3 py-2 tabular-nums">
                        {r.anomaly_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <BarChart
              suffix="%"
              items={regionStats.map((r) => ({
                label: r.region,
                value: r.anomaly_pct,
                sublabel: `${r.anomalies} flagged`,
                tone: r.anomaly_pct >= 1.8 ? "high" : r.anomaly_pct >= 1.3 ? "medium" : "normal",
              }))}
            />
          </div>
        </Panel>

        <Panel title="2. Risk Distribution" description="Validated records by risk classification">
          <BarChart
            items={riskDistribution.map((r) => ({
              label: r.level,
              value: r.count,
              tone: r.level.toLowerCase() as "high" | "medium" | "normal",
            }))}
          />
        </Panel>

        <Panel
          title="3. Enumerator Anomaly Distribution"
          description="Top 10 enumerators by anomaly percentage"
        >
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
