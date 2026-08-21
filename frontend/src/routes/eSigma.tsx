import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Database, FileCheck2, Loader2, Users } from "lucide-react";
import { useState } from "react";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { StatusBadge } from "@/components/ui-kit/RiskBadge";
import { InfoRow, Panel, StatCard } from "@/components/ui-kit/StatCard";
import { surveySummary } from "@/data/mockData";
import { runValidation } from "@/services/api";

export const Route = createFileRoute("/eSigma")({
  head: () => ({
    meta: [
      { title: "Survey Management — eSIGMA Simulation | IntelliSurvey" },
      {
        name: "description",
        content:
          "PLFS survey management console with dataset status, enumerator coverage and AI-assisted survey record validation.",
      },
      { property: "og:title", content: "Survey Management — eSIGMA Simulation" },
      {
        property: "og:description",
        content: "Run intelligent validation on submitted PLFS survey records.",
      },
    ],
  }),
  component: ESigmaPage,
});

type Phase = "idle" | "running" | "done";

function ESigmaPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");

  async function handleRun() {
    setPhase("running");
    await runValidation();
    setPhase("done");
    setTimeout(() => {
      void navigate({ to: "/dashboard" });
    }, 1200);
  }

  return (
    <PortalLayout>
      <PageHeading
        title="Survey Management"
        subtitle="eSIGMA Simulation — survey round operations and dataset readiness"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Survey Selection" className="lg:col-span-2">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <InfoRow label="Survey" value={surveySummary.survey_full_name} />
            <InfoRow label="Survey Round" value={surveySummary.round} />
            <InfoRow
              label="Survey Status"
              value={<StatusBadge label={surveySummary.survey_status} tone="NORMAL" />}
            />
            <InfoRow
              label="Dataset Status"
              value={<StatusBadge label={surveySummary.dataset_status} tone="NORMAL" />}
            />
            <InfoRow
              label="Data Submission"
              value={<StatusBadge label={surveySummary.data_submission} tone="NORMAL" />}
            />
            <InfoRow label="Coverage" value="5 States / 250 Field Enumerators" />
          </div>
        </Panel>

        <Panel title="Round Notes">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All field submissions for the current round have been received.</li>
            <li>• Dataset locked for editing; ready for validation processing.</li>
            <li>• Scrutiny reports must be filed before round closure.</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Records"
          value={surveySummary.total_records}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          label="Enumerators"
          value={surveySummary.enumerators}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Submitted Records"
          value={surveySummary.submitted_records}
          tone="normal"
          icon={<FileCheck2 className="h-4 w-4" />}
        />
        <StatCard label="Pending Records" value={surveySummary.pending_records} tone="normal" />
      </div>

      <div className="mt-4">
        <Panel
          title="Intelligent Survey Validation"
          description="Proposed innovation module — IntelliSurvey"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm text-muted-foreground">
              AI-assisted validation identifies suspicious survey records, unusual enumerator
              patterns and regional anomalies.
            </p>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <button
                type="button"
                onClick={handleRun}
                disabled={phase !== "idle"}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {phase === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Run Intelligent Validation
              </button>

              {phase === "running" ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Analyzing {surveySummary.total_records.toLocaleString("en-IN")} survey records...
                </p>
              ) : null}
              {phase === "done" ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-risk-normal">
                  <CheckCircle2 className="h-4 w-4" />
                  Validation completed successfully.
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>
    </PortalLayout>
  );
}
