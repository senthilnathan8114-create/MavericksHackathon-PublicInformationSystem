"""
IntelliSurvey API
-----------------
Hackathon prototype: intelligent survey data validation.

Run from the backend folder:
    uvicorn main:app --reload

Interactive docs: http://localhost:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pandas.errors import EmptyDataError, ParserError

from services.analytics_service import build_analytics, build_report
from services.anomaly_service import (
    AnalysisResult,
    get_latest_analysis,
    run_anomaly_analysis,
    set_latest_analysis,
)
from services.enumerator_service import build_enumerator_stats
from services.validation_service import validate_survey_data

# Project root is one level above backend/, so we can find data/survey_data.csv
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_DATASET_PATH = PROJECT_ROOT / "data" / "survey_data.csv"

# In-memory working copy. Uploads replace this without touching the original CSV.
_current_df: pd.DataFrame | None = None
_current_source: str = "data/survey_data.csv"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Load the bundled CSV at boot so endpoints have a working dataset."""
    global _current_df, _current_source
    try:
        if DEFAULT_DATASET_PATH.exists():
            _current_df = read_survey_csv(DEFAULT_DATASET_PATH)
            _current_source = "data/survey_data.csv"
    except Exception:
        _current_df = None
    yield


app = FastAPI(
    title="Intelligent Survey Data Validation Platform",
    description=(
        "Hackathon prototype that validates household survey records, "
        "flags anomalies, and summarises enumerator / region risk. "
        "Uses the synthetic CSV at `data/survey_data.csv`. No database and no auth."
    ),
    version="0.1.0",
    contact={"name": "IntelliSurvey"},
    lifespan=lifespan,
)


# React (Vite) will typically run on :5173. Allow all origins for the prototype.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_survey_csv(source) -> pd.DataFrame:
    """
    Load a survey CSV without treating the occupation value 'None' as null.
    Pandas would otherwise convert 'None' to NaN and inflate missing-value counts.
    """
    return pd.read_csv(
        source,
        keep_default_na=False,
        na_values=["", "NA", "NaN", "null"],
    )


def load_default_dataset() -> pd.DataFrame:
    """Load the bundled survey CSV with a clear error if it is missing or unreadable."""
    if not DEFAULT_DATASET_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Survey dataset not found at {DEFAULT_DATASET_PATH}.",
        )
    try:
        df = read_survey_csv(DEFAULT_DATASET_PATH)
    except (ParserError, EmptyDataError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"The survey dataset is not a valid CSV file: {exc}",
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read the survey dataset: {exc}",
        ) from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="The survey dataset is empty.")
    return df


def get_working_dataframe() -> pd.DataFrame:
    """Return the uploaded dataset if present, otherwise the bundled CSV."""
    global _current_df
    if _current_df is not None:
        return _current_df.copy()
    df = load_default_dataset()
    _current_df = df
    return df.copy()


def require_analysis() -> AnalysisResult:
    """GET endpoints read the last POST /analyze result from memory."""
    result = get_latest_analysis()
    if result is None:
        raise HTTPException(
            status_code=409,
            detail="No analysis is available yet. Call POST /analyze first.",
        )
    return result


@app.post(
    "/upload",
    tags=["Dataset"],
    summary="Upload a survey CSV",
    description=(
        "Accepts a CSV file, checks that Pandas can parse it, and keeps it in memory. "
        "Does not overwrite `data/survey_data.csv`."
    ),
)
async def upload_csv(file: UploadFile = File(..., description="Survey data CSV")) -> dict[str, Any]:
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        df = read_survey_csv(BytesIO(content))
    except (ParserError, EmptyDataError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV file: {exc}",
        ) from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="The CSV contains no records.")

    global _current_df, _current_source
    _current_df = df
    _current_source = filename
    # New file means previous scores are stale.
    set_latest_analysis(None)

    return {
        "filename": filename,
        "records": int(len(df)),
        "columns": list(df.columns),
        "column_count": int(df.shape[1]),
        "stored_in": "memory",
        "overwrote_original": False,
        "message": "File accepted. Original dataset was not overwritten. Call POST /analyze to score this file.",
    }


@app.post(
    "/validate",
    tags=["Validation"],
    summary="Run rule-based survey validation",
    description="Checks age, working hours, household size, missing values, and income.",
)
def validate_endpoint() -> dict[str, Any]:
    df = get_working_dataframe()
    try:
        return validate_survey_data(df)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Validation failed: {exc}") from exc


@app.post(
    "/analyze",
    tags=["Analysis"],
    summary="Run anomaly analysis",
    description=(
        "Scores every record. Uses an IsolationForest pipeline when one is wired in; "
        "otherwise a rule-based detector. Stores the result in memory for GET endpoints."
    ),
)
def analyze_endpoint() -> dict[str, Any]:
    df = get_working_dataframe()
    try:
        result = run_anomaly_analysis(df)
        set_latest_analysis(result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    return {
        "total_records": result.total_records,
        "anomaly_count": result.anomaly_count,
        "high_risk_count": result.high_risk_count,
        "medium_risk_count": result.medium_risk_count,
        "normal_count": result.normal_count,
        "status": result.status,
        "detector": result.detector,
        "source": _current_source,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get(
    "/anomalies",
    tags=["Analysis"],
    summary="List anomalous records",
)
def anomalies_endpoint() -> dict[str, Any]:
    result = require_analysis()
    return {
        "count": len(result.anomalies),
        "anomalies": result.anomalies,
    }


@app.get(
    "/enumerators",
    tags=["Analysis"],
    summary="Enumerator-level risk statistics",
)
def enumerators_endpoint() -> dict[str, Any]:
    result = require_analysis()
    enumerators = build_enumerator_stats(result.scored_df)
    return {
        "count": len(enumerators),
        "enumerators": enumerators,
    }


@app.get(
    "/analytics",
    tags=["Analysis"],
    summary="Aggregate analytics for the dashboard",
)
def analytics_endpoint() -> dict[str, Any]:
    result = require_analysis()
    return build_analytics(result.scored_df)


@app.get(
    "/report",
    tags=["Analysis"],
    summary="Concise validation report",
    description="Dashboard-ready summary of the latest analysis.",
)
def report_endpoint() -> dict[str, Any]:
    result = require_analysis()
    enumerators = build_enumerator_stats(result.scored_df)
    analytics = build_analytics(result.scored_df)
    return build_report(
        scored_df=result.scored_df,
        analytics=analytics,
        enumerators=enumerators,
        detector=result.detector,
        source=_current_source,
    )
