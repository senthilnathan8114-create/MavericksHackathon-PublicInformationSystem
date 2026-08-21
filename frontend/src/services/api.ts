/**
 * API service layer.
 *
 * The prototype runs entirely on mock data (src/data/mockData.ts).
 * When the FastAPI backend is available, flip USE_MOCK to false and
 * implement the fetch calls inside each function — the return shapes
 * already match the planned backend payloads.
 *
 * Planned endpoints:
 *   POST http://localhost:8000/analyze
 *   GET  http://localhost:8000/anomalies
 *   GET  http://localhost:8000/enumerators
 *   GET  http://localhost:8000/analytics
 *   GET  http://localhost:8000/report
 */

import {
  anomalies,
  enumerators,
  executiveSummary,
  regionStats,
  riskDistribution,
  surveyRecords,
  surveySummary,
  topRiskEnumerators,
  validationSummary,
  type Anomaly,
  type EnumeratorStat,
  type RegionStat,
  type SurveyRecord,
} from "@/data/mockData";

export const API_BASE_URL = "http://localhost:8000";
export const USE_MOCK = true;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface AnalyzeResponse {
  status: "completed";
  total_records: number;
  validated_records: number;
  anomalies: number;
  high_risk: number;
  medium_risk: number;
  normal: number;
}

/** POST /analyze */
export async function runValidation(): Promise<AnalyzeResponse> {
  await delay(2200);
  return { status: "completed", ...validationSummary };
}

/** GET /anomalies */
export async function getAnomalies(): Promise<Anomaly[]> {
  return anomalies;
}

/** GET /records (survey records with validation metadata) */
export async function getRecords(): Promise<SurveyRecord[]> {
  return surveyRecords;
}

/** GET /enumerators */
export async function getEnumerators(): Promise<EnumeratorStat[]> {
  return enumerators;
}

/** GET /analytics */
export async function getAnalytics(): Promise<{
  regions: RegionStat[];
  risk_distribution: typeof riskDistribution;
  top_enumerators: EnumeratorStat[];
}> {
  return {
    regions: regionStats,
    risk_distribution: riskDistribution,
    top_enumerators: topRiskEnumerators,
  };
}

/** GET /report */
export async function getReport() {
  return {
    survey: surveySummary.survey,
    ...validationSummary,
    executive_summary: executiveSummary,
    generated_at: new Date().toISOString(),
  };
}
