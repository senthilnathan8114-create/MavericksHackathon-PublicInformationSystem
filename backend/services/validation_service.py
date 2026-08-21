"""
Rule-based survey validation.

These checks catch obvious data-entry problems in a PLFS-style household survey.
They are intentionally simple so they stay reliable in a hackathon prototype.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

# Thresholds aligned with the synthetic generator (see data/generate_data.py).
MAX_REASONABLE_AGE = 100
MAX_WEEKLY_HOURS = 84
MAX_HOUSEHOLD_SIZE = 20
MAX_REASONABLE_INCOME = 1_000_000


def _to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def flag_validation_issues(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add boolean flag columns for each validation rule.

    Missing numeric values are treated as invalid for that field and also
    counted separately in the missing-values check.
    """
    flagged = df.copy()

    age = _to_numeric(flagged["age"]) if "age" in flagged.columns else pd.Series(dtype=float)
    hours = (
        _to_numeric(flagged["hours_worked"])
        if "hours_worked" in flagged.columns
        else pd.Series(dtype=float)
    )
    household = (
        _to_numeric(flagged["household_size"])
        if "household_size" in flagged.columns
        else pd.Series(dtype=float)
    )
    income = (
        _to_numeric(flagged["monthly_income"])
        if "monthly_income" in flagged.columns
        else pd.Series(dtype=float)
    )
    employment = (
        flagged["employment_status"].astype(str)
        if "employment_status" in flagged.columns
        else pd.Series([""] * len(flagged))
    )

    # Age: negative, absurdly high, or unparseable.
    flagged["invalid_age"] = age.isna() | (age < 0) | (age > MAX_REASONABLE_AGE)

    # Hours: negative, above a 12-hour * 7-day week, or inconsistent with employment.
    unrealistic_hours = hours.isna() | (hours < 0) | (hours > MAX_WEEKLY_HOURS)
    unemployed_long_hours = employment.isin(["Unemployed", "Not in Labour Force"]) & (hours > 20)
    employed_zero_hours = (employment == "Employed") & (hours <= 0)
    flagged["unrealistic_hours"] = unrealistic_hours | unemployed_long_hours | employed_zero_hours

    # Household size: zero/negative or implausibly large (planted values go up to 99).
    flagged["invalid_household_size"] = household.isna() | (household < 1) | (household > MAX_HOUSEHOLD_SIZE)

    # Income: negative or extreme; also employed with no income, or not working with large income.
    extreme_or_negative = income.isna() | (income < 0) | (income > MAX_REASONABLE_INCOME)
    employed_no_income = (employment == "Employed") & (income <= 0)
    not_working_high_income = employment.isin(["Unemployed", "Not in Labour Force"]) & (income > 10_000)
    flagged["invalid_income"] = extreme_or_negative | employed_no_income | not_working_high_income

    flagged["has_missing_values"] = flagged.isna().any(axis=1)
    return flagged


def row_reasons(row: pd.Series) -> list[str]:
    """Human-readable reasons used later by the anomaly service."""
    reasons: list[str] = []
    if bool(row.get("invalid_age")):
        reasons.append("Invalid age value")
    if bool(row.get("unrealistic_hours")):
        reasons.append("Unrealistic working hours")
    if bool(row.get("invalid_household_size")):
        reasons.append("Invalid household size")
    if bool(row.get("invalid_income")):
        reasons.append("Invalid income value")
    if bool(row.get("has_missing_values")):
        reasons.append("Missing values")
    return reasons


def validate_survey_data(df: pd.DataFrame) -> dict[str, Any]:
    """Return a validation summary and per-check counts."""
    flagged = flag_validation_issues(df)

    issue_counts = {
        "invalid_age": int(flagged["invalid_age"].sum()),
        "unrealistic_hours": int(flagged["unrealistic_hours"].sum()),
        "invalid_household_size": int(flagged["invalid_household_size"].sum()),
        "invalid_income": int(flagged["invalid_income"].sum()),
        "missing_values": int(flagged["has_missing_values"].sum()),
    }
    issue_columns = [
        "invalid_age",
        "unrealistic_hours",
        "invalid_household_size",
        "invalid_income",
        "has_missing_values",
    ]
    records_with_issues = int(flagged[issue_columns].any(axis=1).sum())
    total_issue_flags = int(sum(issue_counts.values()))

    return {
        "total_records": int(len(df)),
        "records_with_issues": records_with_issues,
        "records_without_issues": int(len(df) - records_with_issues),
        "total_issue_flags": total_issue_flags,
        "issue_counts": issue_counts,
        "summary": (
            f"{records_with_issues} of {len(df)} records failed at least one validation check "
            f"({total_issue_flags} issue flags in total)."
        ),
    }
