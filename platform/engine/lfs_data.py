"""Ingestion layer: calibrated LFS microdata and CSV loading.

The platform ships with a deterministic *calibration sample* so the whole
pipeline can be exercised before official microdata is mounted. It is clearly
labelled as synthetic in the UI and in every export. Real data can be dropped
into ``data/microdata/<dataset>__<year>.csv`` or uploaded through the API, and
the identical weighting / indicator / table code is used for both.
"""

from __future__ import annotations

import csv
import hashlib
import random
from dataclasses import dataclass, field
from pathlib import Path

from .metadata import WORKING_AGE_MIN

MICRODATA_DIR = Path(__file__).resolve().parent.parent / "data" / "microdata"

PROVINCES: dict[str, list[str]] = {
    "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "Southern": ["Huye", "Muhanga", "Nyamagabe", "Nyanza", "Ruhango"],
    "Western": ["Karongi", "Nyamasheke", "Rubavu", "Rusizi"],
    "Northern": ["Burera", "Gakenke", "Musanze", "Rulindo"],
    "Eastern": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare"],
}

PROVINCE_SHARE = {
    "Kigali City": 0.17,
    "Southern": 0.24,
    "Western": 0.22,
    "Northern": 0.19,
    "Eastern": 0.18,
}

EDUCATION_LEVELS = ["None", "Primary", "Secondary", "TVET", "Tertiary"]
EDUCATION_WEIGHTS = [0.14, 0.47, 0.24, 0.05, 0.10]

OCCUPATIONS = [
    "Managers",
    "Professionals",
    "Technicians and associate professionals",
    "Clerical support workers",
    "Service and sales workers",
    "Skilled agricultural workers",
    "Craft and related trades workers",
    "Plant and machine operators",
    "Elementary occupations",
]

INDUSTRIES = [
    "Agriculture, forestry and fishing",
    "Manufacturing",
    "Construction",
    "Wholesale and retail trade",
    "Transport and storage",
    "Accommodation and food service",
    "Public administration",
    "Education",
    "Human health and social work",
    "Other service activities",
]

STATUS_EMPLOYMENT = ["Employee", "Self-employed", "Employer", "Unpaid family worker"]

SYNTHETIC_DATASET = "LFS_CALIBRATION"
SYNTHETIC_LABEL = "LFS calibration sample"
SYNTHETIC_NOTE = (
    "Deterministic calibration sample generated for interface and pipeline "
    "development. Not official statistics. Mount official microdata to produce "
    "publication figures."
)


@dataclass
class Microdata:
    dataset_id: str
    year: int
    rows: list[dict] = field(default_factory=list)
    source: str = "synthetic"
    label: str = SYNTHETIC_LABEL
    note: str = SYNTHETIC_NOTE

    @property
    def n(self) -> int:
        return len(self.rows)

    @property
    def fingerprint(self) -> str:
        digest = hashlib.sha256()
        digest.update(f"{self.dataset_id}:{self.year}:{self.source}:{self.n}".encode())
        for row in self.rows[:200]:
            digest.update(repr(sorted(row.items())).encode())
        return digest.hexdigest()[:16]


# --------------------------------------------------------------------------
# Calibration sample generator
# --------------------------------------------------------------------------


def _pick(rand: random.Random, values: list, weights: list):
    return rand.choices(values, weights=weights, k=1)[0]


def _education_for(rand: random.Random, age: int) -> str:
    if age < 18:
        return _pick(rand, ["None", "Primary", "Secondary"], [0.3, 0.5, 0.2])
    if age < 25:
        return _pick(rand, EDUCATION_LEVELS, [0.05, 0.35, 0.4, 0.07, 0.13])
    return _pick(rand, EDUCATION_LEVELS, EDUCATION_WEIGHTS)


def _generate_synthetic(dataset_id: str, year: int, n_rows: int = 5200) -> list[dict]:
    rand = random.Random(f"{dataset_id}:{year}:v3")
    urban_base = 0.24 + 0.012 * (year - 2020)
    rows: list[dict] = []

    for person in range(1, n_rows + 1):
        sex = "Male" if rand.random() < 0.506 else "Female"
        # Age: broad population pyramid, working-age dominated.
        band = rand.choices(
            ["child", "youth", "prime", "mature", "older"],
            weights=[0.14, 0.28, 0.30, 0.18, 0.10],
            k=1,
        )[0]
        if band == "child":
            age = rand.randint(5, WORKING_AGE_MIN - 1)
        elif band == "youth":
            age = rand.randint(WORKING_AGE_MIN, 30)
        elif band == "prime":
            age = rand.randint(31, 44)
        elif band == "mature":
            age = rand.randint(45, 54)
        else:
            age = rand.randint(55, 78)

        residence = "Urban" if rand.random() < urban_base else "Rural"
        province = _pick(rand, list(PROVINCES), [PROVINCE_SHARE[p] for p in PROVINCES])
        district = _pick(rand, PROVINCES[province], [1.0 / len(PROVINCES[province])] * len(PROVINCES[province]))
        education = _education_for(rand, age)
        edu_frac = {
            "None": 0.0,
            "Primary": 0.35,
            "Secondary": 0.65,
            "TVET": 0.72,
            "Tertiary": 1.0,
        }[education]

        working_age = age >= WORKING_AGE_MIN
        if not working_age:
            activity = "outside_lf"
        else:
            p_lf = (
                0.40
                + 0.26 * edu_frac
                + 0.10 * (1.0 if residence == "Urban" else 0.0)
                + 0.12 * (1.0 if age >= 25 else 0.0)
                - 0.22 * (1.0 if sex == "Female" else 0.0)
                + 0.015 * (year - 2020)
            )
            p_lf = max(0.12, min(0.90, p_lf))
            if rand.random() < p_lf:
                p_emp = (
                    0.80
                    + 0.06 * (1.0 if residence == "Urban" else 0.0)
                    - 0.11 * (1.0 if age < 25 else 0.0)
                    + 0.07 * edu_frac
                    - 0.04 * (1.0 if sex == "Female" else 0.0)
                    + 0.008 * (year - 2020)
                )
                p_emp = max(0.45, min(0.95, p_emp))
                activity = "employed" if rand.random() < p_emp else "unemployed"
            else:
                activity = "outside_lf"

        employed = activity == "employed"
        in_lf = activity in ("employed", "unemployed")

        discouraged = (
            not in_lf
            and working_age
            and rand.random()
            < (0.16 if sex == "Female" else 0.11) * (1.35 if age < 25 else 1.0)
        )
        available_not_seeking = (
            not in_lf and working_age and not discouraged and rand.random() < 0.07
        )

        subsistence = employed and rand.random() < (0.16 if residence == "Urban" else 0.44)
        if subsistence:
            industry = "Agriculture, forestry and fishing"
            occupation = "Skilled agricultural workers"
        elif employed:
            industry = _pick(
                rand,
                INDUSTRIES[1:],
                [0.14, 0.11, 0.20, 0.09, 0.07, 0.06, 0.09, 0.05, 0.19],
            )
            occupation = _pick(
                rand,
                OCCUPATIONS[:5] + OCCUPATIONS[6:],
                [
                    0.04 + 0.05 * edu_frac,
                    0.06 + 0.16 * edu_frac,
                    0.08 + 0.10 * edu_frac,
                    0.07,
                    0.24,
                    0.14,
                    0.08,
                    0.19 - 0.08 * edu_frac,
                ],
            )
        else:
            industry = "Not applicable"
            occupation = "Not applicable"

        informal = employed and rand.random() < (
            (0.86 if residence == "Rural" else 0.64) - 0.30 * edu_frac
        )

        if employed:
            status = _pick(
                rand,
                STATUS_EMPLOYMENT,
                [
                    0.34 + 0.20 * edu_frac,
                    0.44 - 0.12 * edu_frac,
                    0.05 + 0.04 * edu_frac,
                    0.17 - 0.08 * edu_frac,
                ],
            )
        else:
            status = "Not applicable"

        hours = round(max(1.0, rand.gauss(41.5, 12.0)), 1) if employed else 0.0

        rows.append(
            {
                "person_id": f"{year}-{person:05d}",
                "year": year,
                "quarter": rand.choice(["Q1", "Q2", "Q3", "Q4"]),
                "province": province,
                "district": district,
                "residence": residence,
                "sex": sex,
                "age": age,
                "education": education,
                "ilo_activity": activity,
                "discouraged": discouraged,
                "available_not_seeking": available_not_seeking,
                "subsistence_agri": subsistence,
                "informal": informal,
                "status_employment": status,
                "occupation": occupation,
                "industry": industry,
                "hours_worked": hours,
                "weight": round(rand.uniform(38.0, 165.0), 3),
            }
        )
    return rows


# --------------------------------------------------------------------------
# CSV loading + dataset registry
# --------------------------------------------------------------------------

REQUIRED_COLUMNS = {"sex", "age", "ilo_activity", "weight"}
BOOL_COLUMNS = ("discouraged", "available_not_seeking", "subsistence_agri", "informal")
INT_COLUMNS = ("age", "year")
FLOAT_COLUMNS = ("hours_worked", "weight")


def _coerce(row: dict) -> dict:
    out = dict(row)
    for column in INT_COLUMNS:
        if column in out:
            try:
                out[column] = int(float(out[column]))
            except (TypeError, ValueError):
                out[column] = None
    for column in FLOAT_COLUMNS:
        if column in out:
            try:
                out[column] = float(out[column])
            except (TypeError, ValueError):
                out[column] = 0.0
    for column in BOOL_COLUMNS:
        if column in out:
            value = out[column]
            if isinstance(value, str):
                out[column] = value.strip().lower() in ("1", "true", "yes", "y")
            else:
                out[column] = bool(value)
    for column in ("sex", "residence", "education", "ilo_activity", "province", "district"):
        if column in out and isinstance(out[column], str):
            out[column] = out[column].strip()
    out.setdefault("province", "Unknown")
    out.setdefault("district", "Unknown")
    for column in BOOL_COLUMNS:
        out.setdefault(column, False)
    out.setdefault("hours_worked", 0.0)
    out.setdefault("status_employment", "Not applicable")
    out.setdefault("occupation", "Not applicable")
    out.setdefault("industry", "Not applicable")
    return out


def microdata_path(dataset_id: str, year: int) -> Path:
    return MICRODATA_DIR / f"{dataset_id}__{year}.csv"


def load_microdata(dataset_id: str, year: int) -> Microdata:
    """Load a dataset for a survey year, falling back to the calibration sample."""
    if dataset_id == SYNTHETIC_DATASET:
        return Microdata(
            dataset_id=dataset_id, year=year, rows=_generate_synthetic(dataset_id, year)
        )

    path = microdata_path(dataset_id, year)
    if not path.exists():
        return Microdata(
            dataset_id=dataset_id,
            year=year,
            rows=_generate_synthetic(f"{dataset_id}:{year}", year),
            source="synthetic-fallback",
            label=f"{dataset_id} (no file for {year})",
        )

    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(
                f"{path.name} is missing required columns: {', '.join(sorted(missing))}"
            )
        rows = [_coerce(row) for row in reader]

    return Microdata(
        dataset_id=dataset_id,
        year=year,
        rows=rows,
        source="field",
        label=dataset_id.replace("_", " "),
        note=f"Loaded from {path.name}",
    )


def list_datasets() -> list[dict]:
    """Datasets available for production, with the years each one covers."""
    datasets = [
        {
            "id": SYNTHETIC_DATASET,
            "label": SYNTHETIC_LABEL,
            "years": list(range(2020, 2026)),
            "source": "synthetic",
            "badge": "Calibration",
            "note": SYNTHETIC_NOTE,
        }
    ]

    seen: dict[str, set[int]] = {}
    if MICRODATA_DIR.exists():
        for path in sorted(MICRODATA_DIR.glob("*__*.csv")):
            stem = path.stem
            if "__" not in stem:
                continue
            dataset_id, _, year_text = stem.rpartition("__")
            try:
                year = int(year_text)
            except ValueError:
                continue
            seen.setdefault(dataset_id, set()).add(year)

    for dataset_id, years in sorted(seen.items()):
        datasets.append(
            {
                "id": dataset_id,
                "label": dataset_id.replace("_", " "),
                "years": sorted(years),
                "source": "field",
                "badge": "Uploaded",
                "note": f"{len(years)} survey year(s) available",
            }
        )
    return datasets
