import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeading, PortalLayout } from "@/components/layout/PortalLayout";
import { RiskBadge } from "@/components/ui-kit/RiskBadge";
import { InfoRow, Panel } from "@/components/ui-kit/StatCard";
import {
  REGIONS,
  enumeratorIds,
  surveyRecords,
  type RiskLevel,
  type SurveyRecord,
} from "@/data/mockData";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Survey Records — PLFS | IntelliSurvey" },
      {
        name: "description",
        content:
          "Browse, search and filter validated PLFS survey records by region, enumerator and risk level, with per-record anomaly detail.",
      },
      { property: "og:title", content: "Survey Records — PLFS" },
      {
        property: "og:description",
        content: "Searchable PLFS record register with anomaly scores and flagging reasons.",
      },
    ],
  }),
  component: RecordsPage,
});

const selectClass =
  "rounded-sm border border-input bg-card px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

function RecordsPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("ALL");
  const [risk, setRisk] = useState("ALL");
  const [enumerator, setEnumerator] = useState("ALL");
  const [selected, setSelected] = useState<SurveyRecord | null>(null);

  const filtered = useMemo(
    () =>
      surveyRecords.filter(
        (r) =>
          r.record_id.toLowerCase().includes(query.trim().toLowerCase()) &&
          (region === "ALL" || r.region === region) &&
          (risk === "ALL" || r.risk_level === risk) &&
          (enumerator === "ALL" || r.enumerator_id === enumerator),
      ),
    [query, region, risk, enumerator],
  );

  const rows = filtered.slice(0, 100);

  return (
    <PortalLayout>
      <PageHeading
        title="Survey Records"
        subtitle="PLFS — record register with validation outcomes"
      />

      <Panel title="Record Register" description={`${filtered.length} records matching filters`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Record ID..."
            className="w-56 rounded-sm border border-input bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <select
            aria-label="Region"
            className={selectClass}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="ALL">Region: All</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Risk Level"
            className={selectClass}
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
          >
            <option value="ALL">Risk Level: All</option>
            {(["HIGH", "MEDIUM", "NORMAL"] as RiskLevel[]).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Enumerator"
            className={selectClass}
            value={enumerator}
            onChange={(e) => setEnumerator(e.target.value)}
          >
            <option value="ALL">Enumerator: All</option>
            {enumeratorIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-table-head text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {[
                  "Record ID",
                  "Enumerator ID",
                  "Region",
                  "Age",
                  "Gender",
                  "Education",
                  "Occupation",
                  "Employment Status",
                  "Hours Worked",
                  "Monthly Income",
                  "Risk Level",
                ].map((h) => (
                  <th key={h} className="border border-border px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.record_id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer odd:bg-card even:bg-secondary/40 hover:bg-secondary"
                >
                  <td className="border border-border px-3 py-2 font-mono">{r.record_id}</td>
                  <td className="border border-border px-3 py-2 font-mono">{r.enumerator_id}</td>
                  <td className="border border-border px-3 py-2">{r.region}</td>
                  <td className="border border-border px-3 py-2 tabular-nums">{r.age}</td>
                  <td className="border border-border px-3 py-2">{r.gender}</td>
                  <td className="border border-border px-3 py-2">{r.education}</td>
                  <td className="border border-border px-3 py-2">{r.occupation}</td>
                  <td className="border border-border px-3 py-2">{r.employment_status}</td>
                  <td className="border border-border px-3 py-2 tabular-nums">{r.hours_worked}</td>
                  <td className="border border-border px-3 py-2 tabular-nums">
                    ₹{r.monthly_income.toLocaleString("en-IN")}
                  </td>
                  <td className="border border-border px-3 py-2">
                    <RiskBadge level={r.risk_level} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="border border-border px-3 py-6 text-center text-muted-foreground" colSpan={11}>
                    No records match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {filtered.length > rows.length ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing first {rows.length} of {filtered.length} matching records.
          </p>
        ) : null}
      </Panel>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-sm border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-table-head px-4 py-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                Record Detail — {selected.record_id}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-sm border border-input px-2 py-0.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-3">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Record Information
              </h3>
              <InfoRow label="Enumerator ID" value={selected.enumerator_id} />
              <InfoRow label="Region" value={selected.region} />
              <InfoRow label="Age" value={selected.age} />
              <InfoRow label="Gender" value={selected.gender} />
              <InfoRow label="Education" value={selected.education} />
              <InfoRow label="Occupation" value={selected.occupation} />
              <InfoRow label="Employment Status" value={selected.employment_status} />
              <InfoRow label="Hours Worked" value={selected.hours_worked} />
              <InfoRow
                label="Monthly Income"
                value={`₹${selected.monthly_income.toLocaleString("en-IN")}`}
              />

              <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Validation
              </h3>
              <InfoRow
                label="Validation Status"
                value={selected.risk_level === "NORMAL" ? "Validated" : "Flagged for review"}
              />
              <InfoRow label="Anomaly Score" value={selected.anomaly_score.toFixed(2)} />
              <InfoRow label="Risk Level" value={<RiskBadge level={selected.risk_level} />} />

              <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Reasons for Flagging
              </h3>
              {selected.reasons.length ? (
                <ul className="list-inside list-disc text-sm">
                  {selected.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No anomalies detected for this record.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PortalLayout>
  );
}
