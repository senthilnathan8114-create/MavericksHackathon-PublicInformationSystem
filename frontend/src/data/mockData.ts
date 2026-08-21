/**
 * Mock data for the IntelliSurvey prototype.
 * Shapes intentionally mirror the future FastAPI response payloads
 * (snake_case fields) so `src/services/api.ts` can swap in real calls later.
 */

export type RiskLevel = "HIGH" | "MEDIUM" | "NORMAL";

export interface SurveyRecord {
  record_id: string;
  enumerator_id: string;
  region: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  education: string;
  occupation: string;
  employment_status: string;
  hours_worked: number;
  monthly_income: number;
  risk_level: RiskLevel;
  anomaly_score: number;
  reasons: string[];
}

export interface Anomaly {
  record_id: string;
  enumerator_id: string;
  region: string;
  anomaly_score: number;
  risk_level: RiskLevel;
  reasons: string[];
}

export interface EnumeratorStat {
  enumerator_id: string;
  region: string;
  total_records: number;
  anomalies: number;
  anomaly_pct: number;
  risk_level: RiskLevel;
}

export interface RegionStat {
  region: string;
  total_records: number;
  anomalies: number;
  anomaly_pct: number;
}

export interface SurveySummary {
  survey: string;
  survey_full_name: string;
  round: string;
  survey_status: string;
  dataset_status: string;
  data_submission: string;
  total_records: number;
  enumerators: number;
  submitted_records: number;
  pending_records: number;
}

export const surveySummary: SurveySummary = {
  survey: "PLFS",
  survey_full_name: "PLFS — Periodic Labour Force Survey",
  round: "Current Survey Round",
  survey_status: "Active",
  dataset_status: "Ready",
  data_submission: "Complete",
  total_records: 10150,
  enumerators: 250,
  submitted_records: 10150,
  pending_records: 0,
};

export const validationSummary = {
  total_records: 10150,
  validated_records: 10150,
  anomalies: 150,
  high_risk: 68,
  medium_risk: 82,
  normal: 10000,
};

export const enumeratorSummary = {
  total: 250,
  high_risk: 12,
  medium_risk: 31,
  normal: 207,
};

export const REGIONS = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
] as const;

const EDUCATION = [
  "Primary",
  "Secondary",
  "Higher Secondary",
  "Diploma",
  "Graduate",
  "Post Graduate",
];

const OCCUPATION = [
  "Agricultural Labour",
  "Construction Worker",
  "Retail Trade",
  "Clerical Staff",
  "Teaching",
  "IT Services",
  "Transport",
  "Household Work",
];

const EMPLOYMENT = [
  "Self-employed",
  "Regular Wage",
  "Casual Labour",
  "Unemployed",
  "Not in Labour Force",
];

const REASONS = [
  "Invalid age",
  "Excessive working hours",
  "Unusually high income",
  "Unusual statistical pattern",
  "Unusual income pattern",
  "Inconsistent employment status",
];

/** Deterministic pseudo-random generator so the demo is stable across renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const pad = (n: number, size: number) => String(n).padStart(size, "0");

function buildRecords(count: number): SurveyRecord[] {
  const rand = rng(20260821);
  const out: SurveyRecord[] = [];

  for (let i = 1; i <= count; i++) {
    const r = rand();
    const region = REGIONS[Math.floor(rand() * REGIONS.length)]!;
    const enumeratorNumber = 1 + Math.floor(rand() * 120);
    const risk: RiskLevel = r > 0.955 ? "HIGH" : r > 0.9 ? "MEDIUM" : "NORMAL";

    const reasons: string[] =
      risk === "HIGH"
        ? [REASONS[Math.floor(rand() * 3)]!]
        : risk === "MEDIUM"
          ? [REASONS[3 + Math.floor(rand() * 3)]!]
          : [];

    const anomaly_score =
      risk === "HIGH"
        ? Number((0.8 + rand() * 0.19).toFixed(2))
        : risk === "MEDIUM"
          ? Number((0.5 + rand() * 0.29).toFixed(2))
          : Number((rand() * 0.35).toFixed(2));

    const invalidAge = reasons.includes("Invalid age");
    const longHours = reasons.includes("Excessive working hours");
    const highIncome = reasons.includes("Unusually high income");

    out.push({
      record_id: `PLFS${pad(i, 5)}`,
      enumerator_id: `ENUM${pad(enumeratorNumber, 3)}`,
      region,
      age: invalidAge ? 3 + Math.floor(rand() * 4) : 18 + Math.floor(rand() * 50),
      gender: rand() > 0.52 ? "Female" : "Male",
      education: EDUCATION[Math.floor(rand() * EDUCATION.length)]!,
      occupation: OCCUPATION[Math.floor(rand() * OCCUPATION.length)]!,
      employment_status: EMPLOYMENT[Math.floor(rand() * EMPLOYMENT.length)]!,
      hours_worked: longHours ? 96 + Math.floor(rand() * 30) : 20 + Math.floor(rand() * 32),
      monthly_income: highIncome
        ? 480000 + Math.floor(rand() * 300000)
        : 6000 + Math.floor(rand() * 42000),
      risk_level: risk,
      anomaly_score,
      reasons,
    });
  }

  // Pin the three showcase records used across the demo narrative.
  out[122] = {
    ...out[122]!,
    record_id: "PLFS00123",
    enumerator_id: "ENUM087",
    region: "Tamil Nadu",
    age: 4,
    risk_level: "HIGH",
    anomaly_score: 0.91,
    reasons: ["Invalid age"],
  };
  out[123] = {
    ...out[123]!,
    record_id: "PLFS00124",
    enumerator_id: "ENUM102",
    region: "Kerala",
    hours_worked: 118,
    risk_level: "HIGH",
    anomaly_score: 0.84,
    reasons: ["Excessive working hours"],
  };
  out[451] = {
    ...out[451]!,
    record_id: "PLFS00452",
    enumerator_id: "ENUM032",
    region: "Karnataka",
    monthly_income: 512000,
    risk_level: "MEDIUM",
    anomaly_score: 0.63,
    reasons: ["Unusual income pattern"],
  };

  return out;
}

/** Representative sample of the 10,150 submitted records. */
export const surveyRecords: SurveyRecord[] = buildRecords(600);

export const anomalies: Anomaly[] = [
  {
    record_id: "PLFS00123",
    enumerator_id: "ENUM087",
    region: "Tamil Nadu",
    anomaly_score: 0.91,
    risk_level: "HIGH",
    reasons: ["Invalid age"],
  },
  {
    record_id: "PLFS00124",
    enumerator_id: "ENUM102",
    region: "Kerala",
    anomaly_score: 0.84,
    risk_level: "HIGH",
    reasons: ["Excessive working hours"],
  },
  {
    record_id: "PLFS00452",
    enumerator_id: "ENUM032",
    region: "Karnataka",
    anomaly_score: 0.63,
    risk_level: "MEDIUM",
    reasons: ["Unusual income pattern"],
  },
  ...surveyRecords
    .filter((r) => r.risk_level !== "NORMAL")
    .filter((r) => !["PLFS00123", "PLFS00124", "PLFS00452"].includes(r.record_id))
    .sort((a, b) => b.anomaly_score - a.anomaly_score)
    .slice(0, 60)
    .map((r) => ({
      record_id: r.record_id,
      enumerator_id: r.enumerator_id,
      region: r.region,
      anomaly_score: r.anomaly_score,
      risk_level: r.risk_level,
      reasons: r.reasons,
    })),
];

function buildEnumerators(): EnumeratorStat[] {
  const map = new Map<string, EnumeratorStat>();

  for (const rec of surveyRecords) {
    const existing = map.get(rec.enumerator_id) ?? {
      enumerator_id: rec.enumerator_id,
      region: rec.region,
      total_records: 0,
      anomalies: 0,
      anomaly_pct: 0,
      risk_level: "NORMAL" as RiskLevel,
    };
    existing.total_records += 1;
    if (rec.risk_level !== "NORMAL") existing.anomalies += 1;
    map.set(rec.enumerator_id, existing);
  }

  const list = [...map.values()].map((e) => {
    const pct = Number(((e.anomalies / e.total_records) * 100).toFixed(1));
    return {
      ...e,
      anomaly_pct: pct,
      risk_level: (pct >= 15 ? "HIGH" : pct >= 6 ? "MEDIUM" : "NORMAL") as RiskLevel,
    };
  });

  const pin = (id: string, patch: Partial<EnumeratorStat>) => {
    const idx = list.findIndex((e) => e.enumerator_id === id);
    if (idx >= 0) list[idx] = { ...list[idx]!, ...patch };
  };

  pin("ENUM087", {
    region: "Tamil Nadu",
    total_records: 48,
    anomalies: 8,
    anomaly_pct: 16.7,
    risk_level: "HIGH",
  });
  pin("ENUM102", {
    region: "Kerala",
    total_records: 52,
    anomalies: 4,
    anomaly_pct: 7.7,
    risk_level: "MEDIUM",
  });
  pin("ENUM032", {
    region: "Karnataka",
    total_records: 41,
    anomalies: 0,
    anomaly_pct: 0,
    risk_level: "NORMAL",
  });

  return list.sort((a, b) => a.enumerator_id.localeCompare(b.enumerator_id));
}

export const enumerators: EnumeratorStat[] = buildEnumerators();

export const topRiskEnumerators: EnumeratorStat[] = [...enumerators]
  .sort((a, b) => b.anomaly_pct - a.anomaly_pct)
  .slice(0, 10);

export const regionStats: RegionStat[] = [
  { region: "Tamil Nadu", total_records: 2450, anomalies: 46 },
  { region: "Kerala", total_records: 1980, anomalies: 33 },
  { region: "Karnataka", total_records: 2210, anomalies: 28 },
  { region: "Andhra Pradesh", total_records: 1860, anomalies: 25 },
  { region: "Telangana", total_records: 1650, anomalies: 18 },
].map((r) => ({
  ...r,
  anomaly_pct: Number(((r.anomalies / r.total_records) * 100).toFixed(2)),
}));

export const riskDistribution = [
  { level: "HIGH" as RiskLevel, count: validationSummary.high_risk },
  { level: "MEDIUM" as RiskLevel, count: validationSummary.medium_risk },
  { level: "NORMAL" as RiskLevel, count: validationSummary.normal },
];

export const executiveSummary =
  "The intelligent validation process identified anomalous records, high-risk enumerator patterns and regional irregularities requiring further review.";

export const enumeratorIds = [...new Set(surveyRecords.map((r) => r.enumerator_id))].sort();
