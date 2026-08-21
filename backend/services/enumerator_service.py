"""Enumerator-level risk statistics from a scored survey dataset."""

from __future__ import annotations

from typing import Any

import pandas as pd


def _enumerator_risk(anomaly_percentage: float, anomaly_count: int) -> str:
    if anomaly_percentage >= 20 or anomaly_count >= 8:
        return "High"
    if anomaly_percentage >= 5 or anomaly_count >= 2:
        return "Medium"
    return "Low"


def build_enumerator_stats(scored_df: pd.DataFrame) -> list[dict[str, Any]]:
    if "enumerator_id" not in scored_df.columns:
        return []

    working = scored_df.copy()
    working["is_anomaly"] = working["risk_level"] != "Normal"

    rows: list[dict[str, Any]] = []
    grouped = working.groupby("enumerator_id", dropna=False)
    for enumerator_id, group in grouped:
        total_records = int(len(group))
        anomaly_count = int(group["is_anomaly"].sum())
        percentage = round((anomaly_count / total_records) * 100, 2) if total_records else 0.0
        rows.append(
            {
                "enumerator_id": str(enumerator_id),
                "total_records": total_records,
                "anomaly_count": anomaly_count,
                "anomaly_percentage": percentage,
                "risk_level": _enumerator_risk(percentage, anomaly_count),
            }
        )

    rows.sort(key=lambda item: (item["anomaly_percentage"], item["anomaly_count"]), reverse=True)
    return rows
