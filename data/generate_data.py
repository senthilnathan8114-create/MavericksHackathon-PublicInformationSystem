"""
generate_data.py
-----------------
Generates a synthetic PLFS-like (Periodic Labour Force Survey) household
survey dataset for a hackathon prototype of an intelligent survey data
validation / anomaly detection platform.

Produces:
    data/survey_data.csv

Contains:
    - 10,000 "clean" / realistic records
    - ~150 planted anomalous records (row-level, enumerator-level and
      region-level anomalies)
    - An `is_planted_anomaly` column (dev/testing only — a real-world
      dataset would not have ground-truth labels; this is here so the
      anomaly-detection models can be validated during the hackathon).

Keep it simple: plain pandas/numpy, no external data-generation libraries.
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

N_NORMAL = 10_000
N_ANOMALIES = 150

N_ENUMERATORS = 250
ENUMERATOR_IDS = [f"ENU{str(i).zfill(4)}" for i in range(1, N_ENUMERATORS + 1)]

REGIONS = [
    "Tamil Nadu", "Maharashtra", "Uttar Pradesh", "Karnataka", "Gujarat",
    "West Bengal", "Rajasthan", "Bihar", "Kerala", "Punjab",
    "Madhya Pradesh", "Andhra Pradesh", "Telangana", "Odisha", "Assam",
]

GENDERS = ["Male", "Female", "Other"]
GENDER_WEIGHTS = [0.51, 0.48, 0.01]

EDUCATION_LEVELS = [
    "Illiterate", "Primary", "Secondary", "Higher Secondary",
    "Graduate", "Post Graduate",
]
EDUCATION_WEIGHTS = [0.08, 0.20, 0.27, 0.20, 0.18, 0.07]

EMPLOYMENT_STATUSES = ["Employed", "Unemployed", "Not in Labour Force"]

OCCUPATIONS_BY_EDU = {
    "Illiterate": ["Agricultural Labourer", "Construction Worker", "Domestic Help", "Street Vendor"],
    "Primary": ["Agricultural Labourer", "Construction Worker", "Domestic Help", "Street Vendor", "Factory Worker"],
    "Secondary": ["Factory Worker", "Shop Assistant", "Driver", "Street Vendor", "Carpenter"],
    "Higher Secondary": ["Shop Assistant", "Clerk", "Driver", "Technician", "Carpenter"],
    "Graduate": ["Clerk", "Teacher", "IT Professional", "Bank Employee", "Sales Executive"],
    "Post Graduate": ["Teacher", "IT Professional", "Bank Employee", "Doctor", "Engineer", "Government Officer"],
}
NOT_WORKING_OCCUPATION = "None"

DATE_START = datetime(2025, 1, 1)
DATE_END = datetime(2025, 12, 31)

# Enumerators deliberately assigned a disproportionate share of anomalies
# (planted "enumerator-level" anomaly pattern -- suggests careless / fraudulent
# data collection by a specific field worker).
SUSPICIOUS_ENUMERATORS = random.sample(ENUMERATOR_IDS, 3)

# A region deliberately given a skewed / implausible distribution
# (planted "region-level" anomaly pattern).
ANOMALOUS_REGION = "Bihar"


# ----------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------
def random_date():
    delta_days = (DATE_END - DATE_START).days
    return DATE_START + timedelta(days=random.randint(0, delta_days))


def sample_age(employment_status):
    """Age distribution roughly tied to employment status."""
    if employment_status == "Employed":
        return int(np.clip(np.random.normal(38, 11), 16, 65))
    elif employment_status == "Unemployed":
        return int(np.clip(np.random.normal(28, 8), 16, 60))
    else:  # Not in Labour Force -> students, elderly, homemakers
        return int(np.clip(np.random.choice(
            [np.random.normal(12, 4), np.random.normal(70, 8), np.random.normal(35, 10)],
            p=None
        ), 5, 90))


def sample_education(age):
    if age < 15:
        return "Illiterate" if age < 6 else "Primary"
    return random.choices(EDUCATION_LEVELS, weights=EDUCATION_WEIGHTS, k=1)[0]


def sample_occupation(employment_status, education):
    if employment_status != "Employed":
        return NOT_WORKING_OCCUPATION
    options = OCCUPATIONS_BY_EDU.get(education, OCCUPATIONS_BY_EDU["Secondary"])
    return random.choice(options)


def sample_hours_worked(employment_status):
    if employment_status == "Employed":
        return int(np.clip(np.random.normal(45, 12), 1, 84))
    elif employment_status == "Unemployed":
        return 0
    else:
        # Not in labour force: usually 0, occasionally small informal hours
        return int(np.random.choice([0, 0, 0, np.random.randint(1, 10)]))


def sample_income(employment_status, occupation, education, hours_worked):
    if employment_status != "Employed" or hours_worked == 0:
        return 0

    base_by_occupation = {
        "Agricultural Labourer": 7000, "Construction Worker": 9000,
        "Domestic Help": 6000, "Street Vendor": 8000, "Factory Worker": 11000,
        "Shop Assistant": 10000, "Driver": 12000, "Carpenter": 13000,
        "Technician": 16000, "Clerk": 18000, "Teacher": 25000,
        "IT Professional": 55000, "Bank Employee": 40000,
        "Sales Executive": 22000, "Doctor": 90000, "Engineer": 60000,
        "Government Officer": 45000,
    }
    base = base_by_occupation.get(occupation, 10000)
    # scale roughly with hours worked and add noise
    income = base * (hours_worked / 45.0) * np.random.normal(1.0, 0.2)
    return int(max(1000, income))


def sample_household_size():
    return int(np.clip(np.random.poisson(4.2), 1, 12))


# ----------------------------------------------------------------------
# NORMAL RECORD GENERATION
# ----------------------------------------------------------------------
def generate_normal_record(enumerator_id=None, region=None):
    employment_status = random.choices(
        EMPLOYMENT_STATUSES, weights=[0.55, 0.10, 0.35], k=1
    )[0]

    age = sample_age(employment_status)
    education = sample_education(age)
    occupation = sample_occupation(employment_status, education)
    hours_worked = sample_hours_worked(employment_status)
    monthly_income = sample_income(employment_status, occupation, education, hours_worked)
    household_size = sample_household_size()
    gender = random.choices(GENDERS, weights=GENDER_WEIGHTS, k=1)[0]

    region = region or random.choice(REGIONS)

    # Region-level anomaly: in ANOMALOUS_REGION, skew towards implausibly
    # high unemployment + very low incomes for those employed (structural
    # bias affecting the whole region rather than a single record).
    if region == ANOMALOUS_REGION:
        if random.random() < 0.5:
            employment_status = "Unemployed"
            hours_worked = 0
            monthly_income = 0
        elif monthly_income > 0:
            monthly_income = int(monthly_income * 0.4)

    return {
        "enumerator_id": enumerator_id or random.choice(ENUMERATOR_IDS),
        "region": region,
        "age": age,
        "gender": gender,
        "education": education,
        "occupation": occupation,
        "employment_status": employment_status,
        "hours_worked": hours_worked,
        "monthly_income": monthly_income,
        "household_size": household_size,
        "survey_date": random_date().strftime("%Y-%m-%d"),
        "is_planted_anomaly": False,
    }


# ----------------------------------------------------------------------
# ANOMALY RECORD GENERATION
# ----------------------------------------------------------------------
ANOMALY_TYPES = [
    "age_too_high",
    "age_negative",
    "hours_impossible",
    "income_extreme",
    "age_occupation_mismatch",
    "household_size_extreme",
    "employment_hours_mismatch",
]


def generate_anomalous_record(enumerator_id=None, region=None):
    record = generate_normal_record(enumerator_id=enumerator_id, region=region)
    anomaly_type = random.choice(ANOMALY_TYPES)

    if anomaly_type == "age_too_high":
        record["age"] = 150

    elif anomaly_type == "age_negative":
        record["age"] = -random.randint(1, 10)

    elif anomaly_type == "hours_impossible":
        record["hours_worked"] = 130

    elif anomaly_type == "income_extreme":
        record["employment_status"] = "Employed"
        record["monthly_income"] = random.randint(2_000_000, 10_000_000)

    elif anomaly_type == "age_occupation_mismatch":
        # e.g. a 6-year-old "Doctor" or an 8-year-old "Engineer"
        record["age"] = random.randint(4, 10)
        record["employment_status"] = "Employed"
        record["occupation"] = random.choice(["Doctor", "Engineer", "IT Professional", "Government Officer"])
        record["hours_worked"] = random.randint(20, 60)

    elif anomaly_type == "household_size_extreme":
        record["household_size"] = random.choice([0, random.randint(40, 99)])

    elif anomaly_type == "employment_hours_mismatch":
        # Unemployed / not in labour force but reporting full-time hours,
        # or Employed but reporting 0 hours with high income.
        if random.random() < 0.5:
            record["employment_status"] = random.choice(["Unemployed", "Not in Labour Force"])
            record["hours_worked"] = random.randint(60, 90)
        else:
            record["employment_status"] = "Employed"
            record["hours_worked"] = 0
            record["monthly_income"] = random.randint(50_000, 200_000)

    record["is_planted_anomaly"] = True
    return record


# ----------------------------------------------------------------------
# BUILD DATASET
# ----------------------------------------------------------------------
def build_dataset():
    records = []

    # --- Normal records ---
    for _ in range(N_NORMAL):
        records.append(generate_normal_record())

    # --- Anomalous records ---
    # A chunk of anomalies is deliberately concentrated among a handful of
    # "suspicious" enumerators (enumerator-level anomaly pattern).
    n_from_suspicious = int(N_ANOMALIES * 0.4)
    n_random = N_ANOMALIES - n_from_suspicious

    for _ in range(n_from_suspicious):
        enum_id = random.choice(SUSPICIOUS_ENUMERATORS)
        records.append(generate_anomalous_record(enumerator_id=enum_id))

    for _ in range(n_random):
        records.append(generate_anomalous_record())

    df = pd.DataFrame(records)

    # Shuffle rows so anomalies aren't clustered at the end of the file
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

    # Assign sequential record_id after shuffling
    df.insert(0, "record_id", [f"REC{str(i).zfill(6)}" for i in range(1, len(df) + 1)])

    # Reorder columns as requested
    column_order = [
        "record_id", "enumerator_id", "region", "age", "gender", "education",
        "occupation", "employment_status", "hours_worked", "monthly_income",
        "household_size", "survey_date", "is_planted_anomaly",
    ]
    df = df[column_order]

    return df


def main():
    import os

    df = build_dataset()

    os.makedirs("data", exist_ok=True)
    output_path = "data/survey_data.csv"
    df.to_csv(output_path, index=False)

    total_records = len(df)
    total_anomalies = int(df["is_planted_anomaly"].sum())

    print(f"Dataset saved to: {output_path}")
    print(f"Total records: {total_records}")
    print(f"Planted anomalies: {total_anomalies}")
    print(f"Suspicious enumerators (planted): {', '.join(SUSPICIOUS_ENUMERATORS)}")
    print(f"Anomalous region (planted): {ANOMALOUS_REGION}")


if __name__ == "__main__":
    main()
