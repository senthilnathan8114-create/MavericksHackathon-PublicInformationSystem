import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { BarChart } from "@/components/ui-kit/BarChart";
import { RiskBadge } from "@/components/ui-kit/RiskBadge";
import { Panel, StatCard } from "@/components/ui-kit/StatCard";
import { anomalies, riskDistribution, validationSummary } from "@/data/mockData";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Intelligent Validation Dashboard | IntelliSurvey" },
      {
        name: "description",
        content:
          "Validation results for the PLFS survey round: anomaly counts, risk distribution and recently flagged survey records.",
      },
      { property: "og:title", content: "Intelligent Validation Dashboard" },
      {
        property: "og:description",
        content: "Anomaly counts, risk distribution and flagged PLFS survey records.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const recent = anomalies.slice(0, 12);

  return (
    <PortalLayout>
      <PageHeading
        title="Intelligent Validation Dashboard"
        subtitle="PLFS — Current Survey Round · Validation run completed"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Records" value={validationSummary.total_records} />
        <StatCard
          label="Validated Records"
          value={validationSummary.validated_records}
          tone="normal"
        />
        <StatCard label="Anomalies" value={validationSummary.anomalies} tone="medium" />
        <StatCard label="High Risk" value={validationSummary.high_risk} tone="high" />
        <StatCard label="Medium Risk" value={validationSummary.medium_risk} tone="medium" />
        <StatCard label="Normal" value={validationSummary.normal} tone="normal" />
      </div>

      <div className="mt-4">
        <Panel title="Risk Distribution" description="Records classified by validation risk level">
          <BarChart
            items={riskDistribution.map((r) => ({
              label: r.level,
              value: r.count,
              tone: r.level.toLowerCase() as "high" | "medium" | "normal",
            }))}
          />
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Recent Anomalies"
          description="Highest scoring flagged records from the latest validation run"
          action={
            <Link
              to="/records"
              className="rounded-sm border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
            >
              View All Anomalies
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-table-head text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="border border-border px-3 py-2">Record ID</th>
                  <th className="border border-border px-3 py-2">Enumerator ID</th>
                  <th className="border border-border px-3 py-2">Region</th>
                  <th className="border border-border px-3 py-2">Anomaly Score</th>
                  <th className="border border-border px-3 py-2">Risk Level</th>
                  <th className="border border-border px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.record_id} className="odd:bg-card even:bg-secondary/40">
                    <td className="border border-border px-3 py-2 font-mono">{a.record_id}</td>
                    <td className="border border-border px-3 py-2 font-mono">{a.enumerator_id}</td>
                    <td className="border border-border px-3 py-2">{a.region}</td>
                    <td className="border border-border px-3 py-2 font-mono tabular-nums">
                      {a.anomaly_score.toFixed(2)}
                    </td>
                    <td className="border border-border px-3 py-2">
                      <RiskBadge level={a.risk_level} />
                    </td>
                    <td className="border border-border px-3 py-2">
                      {a.reasons.join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </PortalLayout>
  );
}
