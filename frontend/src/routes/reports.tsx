import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { InfoRow, Panel, StatCard } from "@/components/ui-kit/StatCard";
import { executiveSummary, surveySummary, validationSummary } from "@/data/mockData";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Validation Reports — PLFS | IntelliSurvey" },
      {
        name: "description",
        content:
          "Generate and export the PLFS intelligent validation report with anomaly counts, risk breakdown and an executive summary.",
      },
      { property: "og:title", content: "Validation Reports — PLFS" },
      {
        property: "og:description",
        content: "Executive summary and export of PLFS validation findings.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [generated, setGenerated] = useState(false);

  const reportText = [
    "IntelliSurvey — Validation Report (Prototype)",
    "==========================================",
    `Survey: ${surveySummary.survey}`,
    `Round: ${surveySummary.round}`,
    `Records Analyzed: ${validationSummary.total_records}`,
    `Anomalies Detected: ${validationSummary.anomalies}`,
    `High Risk: ${validationSummary.high_risk}`,
    `Medium Risk: ${validationSummary.medium_risk}`,
    `Normal: ${validationSummary.normal}`,
    "",
    "Executive Summary:",
    executiveSummary,
    "",
    "Prototype — Not an official Government application",
  ].join("\n");

  function handleExport() {
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intellisurvey-plfs-validation-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PortalLayout>
      <PageHeading
        title="Validation Reports"
        subtitle="Scrutiny documentation for the current PLFS survey round"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Survey" value={surveySummary.survey} />
        <StatCard label="Records Analyzed" value={validationSummary.total_records} />
        <StatCard label="Anomalies Detected" value={validationSummary.anomalies} tone="medium" />
        <StatCard label="High Risk" value={validationSummary.high_risk} tone="high" />
        <StatCard label="Medium Risk" value={validationSummary.medium_risk} tone="medium" />
        <StatCard label="Normal" value={validationSummary.normal} tone="normal" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Executive Summary">
          <p className="text-sm leading-relaxed text-foreground">{executiveSummary}</p>
          <div className="mt-4">
            <InfoRow label="Survey Round" value={surveySummary.round} />
            <InfoRow label="Dataset Status" value={surveySummary.dataset_status} />
            <InfoRow label="Validation Status" value="Completed" />
          </div>
        </Panel>

        <Panel title="Report Actions">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setGenerated(true)}
              className="rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Generate Validation Report
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-sm border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
            >
              Export Report
            </button>
            {generated ? (
              <p className="text-sm font-semibold text-risk-normal">
                Validation report generated successfully.
              </p>
            ) : null}
          </div>

          {generated ? (
            <pre className="mt-4 max-h-72 overflow-auto rounded-sm border border-border bg-secondary/50 p-3 font-mono text-xs leading-relaxed">
              {reportText}
            </pre>
          ) : null}
        </Panel>
      </div>
    </PortalLayout>
  );
}
