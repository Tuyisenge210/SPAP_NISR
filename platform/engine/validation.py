"""Data validation: structural, completeness and consistency checks.

Results feed the Validation view and gate the pipeline: a blocking failure stops
production, warnings are carried into the run record for the audit trail.
"""

from __future__ import annotations

from collections import Counter

from . import indicators as ind
from .lfs_data import Microdata
from .metadata import EDUCATION_LEVELS, WORKING_AGE_MIN

VALID_ACTIVITY = {"employed", "unemployed", "outside_lf"}
VALID_SEX = {"Male", "Female"}


def _check(check_id: str, label: str, description: str, severity: str, affected: int, total: int, detail: str = "") -> dict:
    if affected == 0:
        status = "pass"
    elif severity == "blocking":
        status = "fail"
    else:
        status = "warn"
    return {
        "id": check_id,
        "label": label,
        "description": description,
        "severity": severity,
        "status": status,
        "affected": affected,
        "share": round(100.0 * affected / total, 2) if total else 0.0,
        "detail": detail,
    }


def run_checks(md: Microdata) -> dict:
    rows = md.rows
    total = len(rows)
    if not total:
        return {
            "checks": [
                _check("rows", "Dataset is not empty", "At least one record is required.", "blocking", 1, 1, "No records loaded."),
            ],
            "summary": {"pass": 0, "warn": 0, "fail": 1, "blocking": True},
            "rows": 0,
        }

    checks: list[dict] = []

    bad_weights = sum(1 for r in rows if ind.weight_of(r) <= 0)
    checks.append(
        _check(
            "weights",
            "Sampling weights present and positive",
            "Every record must carry a positive sampling weight.",
            "blocking",
            bad_weights,
            total,
            f"{bad_weights:,} records have a zero or missing weight.",
        )
    )

    bad_sex = sum(1 for r in rows if r.get("sex") not in VALID_SEX)
    checks.append(
        _check(
            "sex",
            "Sex recorded for every person",
            "Sex must be 'Male' or 'Female'; it drives every disaggregation.",
            "blocking",
            bad_sex,
            total,
        )
    )

    bad_age = sum(1 for r in rows if not isinstance(r.get("age"), int) or r["age"] < 5 or r["age"] > 100)
    checks.append(
        _check(
            "age",
            "Age within plausible range",
            "Age in completed years, expected between 5 and 100.",
            "blocking",
            bad_age,
            total,
        )
    )

    bad_activity = sum(1 for r in rows if r.get("ilo_activity") not in VALID_ACTIVITY)
    checks.append(
        _check(
            "activity",
            "Labour force status classified",
            "Status must be employed, unemployed or outside the labour force.",
            "blocking",
            bad_activity,
            total,
        )
    )

    bad_education = sum(1 for r in rows if r.get("education") not in EDUCATION_LEVELS)
    checks.append(
        _check(
            "education",
            "Educational attainment mapped to the standard classification",
            "Education is used by Chapter 6 tables.",
            "warning",
            bad_education,
            total,
        )
    )

    employed = [r for r in rows if ind.is_employed(r)]
    zero_hours = sum(1 for r in employed if not r.get("hours_worked"))
    checks.append(
        _check(
            "hours",
            "Hours worked reported for employed persons",
            "Zero hours for an employed person affects the underemployment measure.",
            "warning",
            zero_hours,
            max(len(employed), 1),
        )
    )

    ids = Counter(r.get("person_id") for r in rows if r.get("person_id"))
    duplicates = sum(count - 1 for count in ids.values() if count > 1)
    checks.append(
        _check(
            "duplicates",
            "No duplicate person identifiers",
            "Duplicate identifiers indicate a join or append problem.",
            "warning",
            duplicates,
            total,
        )
    )

    by_district: dict[str, float] = {}
    for row in rows:
        district = row.get("district") or "Unknown"
        by_district[district] = by_district.get(district, 0.0) + ind.weight_of(row)
    total_weight = sum(by_district.values()) or 1.0
    thin = [d for d, w in by_district.items() if 100.0 * w / total_weight < 0.4]
    checks.append(
        _check(
            "district_coverage",
            "Every district carries enough weighted cases",
            "Districts below 0.4% of weighted population make district tables unstable.",
            "warning",
            len(thin),
            len(by_district),
            f"Thin districts: {', '.join(sorted(thin)[:6])}" if thin else "",
        )
    )

    working_age = sum(1 for r in rows if ind.is_working_age(r))
    checks.append(
        _check(
            "working_age",
            f"Working-age population ({WORKING_AGE_MIN}+) identifiable",
            "Chapter 1-5 tables require a sufficient working-age sample.",
            "blocking",
            0 if working_age > 0 else 1,
            total,
            f"{working_age:,} working-age persons of {total:,} records.",
        )
    )

    summary = {
        "pass": sum(1 for c in checks if c["status"] == "pass"),
        "warn": sum(1 for c in checks if c["status"] == "warn"),
        "fail": sum(1 for c in checks if c["status"] == "fail"),
    }
    summary["blocking"] = summary["fail"] > 0
    return {"checks": checks, "summary": summary, "rows": total, "dataset": md.dataset_id, "year": md.year}
