"""Aggregate analytics and a short dashboard report."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import pandas as pd


def build_analytics(scored_df: pd.DataFrame) -> dict[str, Any]:
    total_records = int(len(scored_df))
    high_risk_count = int((scored_df["risk_level"] == "High").sum())
    medium_risk_count = int((scored_df["risk_level"] == "Medium").sum())
    normal_count = int((scored_df["risk_level"] == "Normal").sum())
    anomaly_count = high_risk_count + medium_risk_count

    region_stats: list[dict[str, Any]] = []
    if "region" in scored_df.columns:
        for region, group in scored_df.groupby("region", dropna=False):
            region_anomalies = int((group["risk_level"] != "Normal").sum())
            region_total = int(len(group))
            region_stats.append(
                {
                    "region": str(region),
                    "total_records": region_total,
                    "anomaly_count": region_anomalies,
                    "normal_count": int((group["risk_level"] == "Normal").sum()),
                    "high_risk_count": int((group["risk_level"] == "High").sum()),
                    "medium_risk_count": int((group["risk_level"] == "Medium").sum()),
                    "anomaly_percentage": round((region_anomalies / region_total) * 100, 2)
                    if region_total
                    else 0.0,
                }
            )
        region_stats.sort(key=lambda item: item["anomaly_percentage"], reverse=True)

    return {
        "total_records": total_records,
        "anomaly_count": anomaly_count,
        "normal_count": normal_count,
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "region_statistics": region_stats,
        "risk_level_distribution": {
            "High": high_risk_count,
            "Medium": medium_risk_count,
            "Normal": normal_count,
        },
    }


def build_report(
    scored_df: pd.DataFrame,
    analytics: dict[str, Any],
    enumerators: list[dict[str, Any]],
    detector: str,
    source: str,
) -> dict[str, Any]:
    total = analytics["total_records"]
    anomalies = analytics["anomaly_count"]
    rate = round((anomalies / total) * 100, 2) if total else 0.0

    top_enumerators = [row for row in enumerators if row["anomaly_count"] > 0][:5]
    top_regions = analytics["region_statistics"][:5]

    findings = [
        f"{anomalies} of {total} records were flagged ({rate}%).",
        f"{analytics['high_risk_count']} high-risk and {analytics['medium_risk_count']} medium-risk records.",
    ]
    if top_enumerators:
        worst = top_enumerators[0]
        findings.append(
            f"Enumerator {worst['enumerator_id']} has the highest anomaly share "
            f"({worst['anomaly_percentage']}% of {worst['total_records']} records)."
        )
    if top_regions:
        findings.append(
            f"{top_regions[0]['region']} currently shows the highest regional anomaly rate "
            f"({top_regions[0]['anomaly_percentage']}%)."
        )

    recommendations = [
        "Review high-risk records before they enter official tabulation.",
        "Follow up with enumerators who have elevated anomaly percentages.",
        "Re-check age, hours, household size, and income fields on flagged rows.",
    ]

    return {
        "title": "Survey data validation report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "detector": detector,
        "overview": (
            f"Analysed {total} survey records. {anomalies} look anomalous ({rate}%). "
            "Use the anomalies and enumerator views for follow-up."
        ),
        "key_findings": findings,
        "totals": {
            "total_records": total,
            "anomaly_count": anomalies,
            "normal_count": analytics["normal_count"],
            "high_risk_count": analytics["high_risk_count"],
            "medium_risk_count": analytics["medium_risk_count"],
            "anomaly_percentage": rate,
        },
        "top_risk_enumerators": top_enumerators,
        "top_risk_regions": top_regions,
        "recommendations": recommendations,
        "record_count": int(len(scored_df)),
    }
