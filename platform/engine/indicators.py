"""Weighted indicator computation.

Every function returns a validated ratio (numerator, denominator, value) rather
than a bare percentage, so the UI and the Excel export can show the estimation
basis behind each published figure.
"""

from __future__ import annotations

from typing import Callable, Iterable

from .metadata import WORKING_AGE_MIN, YOUTH_MAX


# --------------------------------------------------------------------------
# Row predicates (the "derived variables" of the metadata layer)
# --------------------------------------------------------------------------


def weight_of(row: dict) -> float:
    value = row.get("weight")
    return float(value) if isinstance(value, (int, float)) and value > 0 else 0.0


def age_of(row: dict) -> int:
    value = row.get("age")
    return int(value) if isinstance(value, (int, float)) else -1


def is_working_age(row: dict) -> bool:
    return age_of(row) >= WORKING_AGE_MIN


def is_employed(row: dict) -> bool:
    return row.get("ilo_activity") == "employed"


def is_unemployed(row: dict) -> bool:
    return row.get("ilo_activity") == "unemployed"


def in_labour_force(row: dict) -> bool:
    return is_employed(row) or is_unemployed(row)


def is_youth(row: dict) -> bool:
    return WORKING_AGE_MIN <= age_of(row) <= YOUTH_MAX


def is_underemployed(row: dict) -> bool:
    hours = row.get("hours_worked") or 0
    return is_employed(row) and float(hours) < 40


def is_discouraged(row: dict) -> bool:
    return bool(row.get("discouraged"))


def is_available(row: dict) -> bool:
    return bool(row.get("available_not_seeking"))


def is_informal(row: dict) -> bool:
    return bool(row.get("informal"))


def is_subsistence(row: dict) -> bool:
    return bool(row.get("subsistence_agri"))


def wsum(rows: Iterable[dict], predicate: Callable[[dict], bool] | None = None) -> float:
    total = 0.0
    if predicate is None:
        for row in rows:
            total += weight_of(row)
        return total
    for row in rows:
        if predicate(row):
            total += weight_of(row)
    return total


def ratio(numerator: float, denominator: float) -> dict:
    value = (100.0 * numerator / denominator) if denominator > 0 else None
    return {
        "numerator": round(numerator, 3),
        "denominator": round(denominator, 3),
        "value": round(value, 2) if value is not None else None,
    }


# --------------------------------------------------------------------------
# Indicator functions (referenced by dotted path in metadata.INDICATORS)
# --------------------------------------------------------------------------


def labour_force_participation_rate(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_working_age(r) and in_labour_force(r)),
        wsum(rows, is_working_age),
    )


def employment_to_population_ratio(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_working_age(r) and is_employed(r)),
        wsum(rows, is_working_age),
    )


def unemployment_rate_lu1(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_working_age(r) and is_unemployed(r)),
        wsum(rows, lambda r: is_working_age(r) and in_labour_force(r)),
    )


def unemployment_rate_lu2(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_working_age(r) and (is_unemployed(r) or is_discouraged(r))),
        wsum(
            rows,
            lambda r: is_working_age(r) and (in_labour_force(r) or is_discouraged(r)),
        ),
    )


def unemployment_rate_lu3(rows: list[dict]) -> dict:
    def numerator(row: dict) -> bool:
        return is_working_age(row) and (is_unemployed(row) or is_discouraged(row) or is_available(row))

    def denominator(row: dict) -> bool:
        return is_working_age(row) and (
            in_labour_force(row) or is_discouraged(row) or is_available(row)
        )

    return ratio(wsum(rows, numerator), wsum(rows, denominator))


def labour_underutilisation_rate(rows: list[dict]) -> dict:
    def numerator(row: dict) -> bool:
        return is_working_age(row) and (
            is_unemployed(row)
            or is_underemployed(row)
            or is_discouraged(row)
            or is_available(row)
        )

    def denominator(row: dict) -> bool:
        return is_working_age(row) and (
            in_labour_force(row) or is_discouraged(row) or is_available(row)
        )

    return ratio(wsum(rows, numerator), wsum(rows, denominator))


def informality_rate(rows: list[dict]) -> dict:
    return ratio(wsum(rows, lambda r: is_employed(r) and is_informal(r)), wsum(rows, is_employed))


def subsistence_share(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_employed(r) and is_subsistence(r)), wsum(rows, is_employed)
    )


def time_related_underemployment_rate(rows: list[dict]) -> dict:
    return ratio(wsum(rows, is_underemployed), wsum(rows, is_employed))


def youth_unemployment_rate(rows: list[dict]) -> dict:
    return ratio(
        wsum(rows, lambda r: is_youth(r) and is_unemployed(r)),
        wsum(rows, lambda r: is_youth(r) and in_labour_force(r)),
    )


INDICATOR_FUNCTIONS: dict[str, Callable[[list[dict]], dict]] = {
    "LFPR": labour_force_participation_rate,
    "EPR": employment_to_population_ratio,
    "UR1": unemployment_rate_lu1,
    "LU2": unemployment_rate_lu2,
    "LU3": unemployment_rate_lu3,
    "LUUR": labour_underutilisation_rate,
    "INFORMALITY": informality_rate,
    "SUBSIST_SHARE": subsistence_share,
    "UNDEREMP": time_related_underemployment_rate,
    "YOUTH_UR": youth_unemployment_rate,
}


def evaluate(rows: list[dict], code: str) -> dict:
    function = INDICATOR_FUNCTIONS.get(code)
    if function is None:
        raise KeyError(f"Unknown indicator: {code}")
    result = function(rows)
    return {**result, "code": code}


def population_totals(rows: list[dict]) -> dict:
    working_age = wsum(rows, is_working_age)
    return {
        "persons": len(rows),
        "weighted_population": round(wsum(rows), 1),
        "weighted_working_age": round(working_age, 1),
        "weighted_labour_force": round(wsum(rows, lambda r: is_working_age(r) and in_labour_force(r)), 1),
        "weighted_employed": round(wsum(rows, lambda r: is_working_age(r) and is_employed(r)), 1),
        "weighted_unemployed": round(wsum(rows, lambda r: is_working_age(r) and is_unemployed(r)), 1),
    }
