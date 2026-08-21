"""
Anomaly detection service.

`run_ml_anomaly_detection` is the hook for an IsolationForest pipeline.
Until that module exists, analysis falls back to a transparent rule-based scorer
so the rest of the API can be demoed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from services.validation_service import flag_validation_issues, row_reasons

# Latest POST /analyze result, shared with GET endpoints.
_latest_analysis: "AnalysisResult | None" = None


@dataclass
class AnalysisResult:
    scored_df: pd.DataFrame
    anomalies: list[dict[str, Any]]
    total_records: int
    anomaly_count: int
    high_risk_count: int
    medium_risk_count: int
    normal_count: int
    status: str
    detector: str
    extra: dict[str, Any] = field(default_factory=dict)


def get_latest_analysis() -> AnalysisResult | None:
    return _latest_analysis


def set_latest_analysis(result: AnalysisResult | None) -> None:
    global _latest_analysis
    _latest_analysis = result


def run_ml_anomaly_detection(df: pd.DataFrame) -> pd.DataFrame | None:
    """
    Placeholder for IsolationForest (or any sklearn pipeline).

    When implemented, return a copy of `df` with these columns:
      - anomaly_score (float, higher = more anomalous)
      - risk_level ("High" | "Medium" | "Normal")
      - reasons (list[str])

    Return None to use the heuristic fallback.
    """
    # Example of the future wiring:
    # from sklearn.ensemble import IsolationForest
    # features = df[["age", "hours_worked", "monthly_income", "household_size"]]
    # model = IsolationForest(contamination=0.02, random_state=42)
    # scores = -model.fit_predict(features)  # 1 = anomaly
    _ = df
    return None


def _heuristic_anomaly_detection(df: pd.DataFrame) -> pd.DataFrame:
    """
    Score records from validation flags plus a few extra consistency checks
    (young professionals, extreme z-scores) so planted anomalies surface
    even when they pass a single simple threshold.
    """
    scored = flag_validation_issues(df)

    age = pd.to_numeric(scored.get("age"), errors="coerce")
    hours = pd.to_numeric(scored.get("hours_worked"), errors="coerce")
    income = pd.to_numeric(scored.get("monthly_income"), errors="coerce")
    occupation = (
        scored["occupation"].astype(str)
        if "occupation" in scored.columns
        else pd.Series([""] * len(scored), index=scored.index)
    )
    employment = (
        scored["employment_status"].astype(str)
        if "employment_status" in scored.columns
        else pd.Series([""] * len(scored), index=scored.index)
    )

    professional_jobs = occupation.isin(
        ["Doctor", "Engineer", "IT Professional", "Government Officer"]
    )
    scored["age_occupation_mismatch"] = (age < 15) & professional_jobs & (employment == "Employed")

    # Extra weight for planted extremes (age 150, hours 130, income in the millions).
    extreme_age = age > 120
    extreme_hours = hours > 100
    extreme_income = income > 1_000_000

    flag_cols = [
        "invalid_age",
        "unrealistic_hours",
        "invalid_household_size",
        "invalid_income",
        "has_missing_values",
        "age_occupation_mismatch",
    ]
    base_score = scored[flag_cols].sum(axis=1).astype(float)
    scored["anomaly_score"] = (
        base_score
        + extreme_age.astype(float) * 2
        + extreme_hours.astype(float) * 2
        + extreme_income.astype(float) * 2
    )

    def classify(score: float) -> str:
        if score >= 3:
            return "High"
        if score >= 1:
            return "Medium"
        return "Normal"

    scored["risk_level"] = scored["anomaly_score"].map(classify)

    reasons_list: list[list[str]] = []
    for _, row in scored.iterrows():
        reasons = row_reasons(row)
        if bool(row.get("age_occupation_mismatch")):
            reasons.append("Age and occupation mismatch")
        reasons_list.append(reasons)
    scored["reasons"] = reasons_list
    return scored


def _records_to_anomaly_payload(scored: pd.DataFrame) -> list[dict[str, Any]]:
    anomalous = scored[scored["risk_level"] != "Normal"].copy()
    payload: list[dict[str, Any]] = []
    for _, row in anomalous.iterrows():
        payload.append(
            {
                "record_id": str(row.get("record_id", "")),
                "enumerator_id": str(row.get("enumerator_id", "")),
                "region": str(row.get("region", "")),
                "anomaly_score": float(row.get("anomaly_score", 0)),
                "risk_level": str(row.get("risk_level", "Medium")),
                "reasons": list(row.get("reasons") or []),
            }
        )
    payload.sort(key=lambda item: item["anomaly_score"], reverse=True)
    return payload


def run_anomaly_analysis(df: pd.DataFrame) -> AnalysisResult:
    """Try the ML hook first; fall back to the rule-based detector."""
    if df is None or df.empty:
        raise ValueError("Cannot analyse an empty dataset.")

    detector = "heuristic"
    scored = run_ml_anomaly_detection(df)
    if scored is None:
        scored = _heuristic_anomaly_detection(df)
        detector = "heuristic"
        status = "completed_with_heuristic_detector"
    else:
        detector = "isolation_forest"
        status = "completed_with_ml_detector"

    high = int((scored["risk_level"] == "High").sum())
    medium = int((scored["risk_level"] == "Medium").sum())
    normal = int((scored["risk_level"] == "Normal").sum())
    anomaly_count = high + medium

    return AnalysisResult(
        scored_df=scored,
        anomalies=_records_to_anomaly_payload(scored),
        total_records=int(len(scored)),
        anomaly_count=anomaly_count,
        high_risk_count=high,
        medium_risk_count=medium,
        normal_count=normal,
        status=status,
        detector=detector,
    )
