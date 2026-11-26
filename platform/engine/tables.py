"""Chapter table production.

A table is the central production object in SPAP: dashboards, figures and
exports all consume these results instead of recalculating their own figures.
Each cell keeps its numerator and denominator so the estimation basis travels
with the published number.
"""

from __future__ import annotations

from . import indicators as ind
from .metadata import AGE_BANDS, EDUCATION_LEVELS, INDICATORS, WORKING_AGE_MIN, YOUTH_MAX

PERCENT_COLUMNS = ("Estimate (%)", "Numerator", "Denominator")


def _fmt(value, digits: int = 1) -> str:
    if value is None:
        return "—"
    return f"{value:,.{digits}f}"


def _percent_cell(result: dict) -> dict:
    return {
        "value": result.get("value"),
        "display": _fmt(result.get("value")),
        "numerator": result.get("numerator"),
        "denominator": result.get("denominator"),
    }


def _count_cell(value: float | None) -> dict:
    return {"value": value, "display": _fmt(value, 0), "numerator": None, "denominator": None}


def _indicator_label(code: str) -> str:
    meta = INDICATORS.get(code, {})
    return f"{meta.get('short', code)} — {meta.get('name', code)}"


def _rows_for_indicators(groups: list[tuple[str, list[dict]]], codes: list[str]) -> list[dict]:
    rows = []
    for code in codes:
        cells = []
        for _, subset in groups:
            cells.append(_percent_cell(ind.evaluate(subset, code)))
        rows.append({"label": _indicator_label(code), "cells": cells})
    return rows


def _filter_rows(rows: list[dict], filters: dict | None) -> list[dict]:
    if not filters:
        return rows
    for column, expected in filters.items():
        rows = [row for row in rows if row.get(column) == expected]
    return rows


# --------------------------------------------------------------------------
# Builders
# --------------------------------------------------------------------------


def national_summary(rows: list[dict], spec: dict) -> dict:
    codes = spec.get("indicators") or []
    table_rows = []
    for code in codes:
        result = ind.evaluate(rows, code)
        table_rows.append(
            {
                "label": _indicator_label(code),
                "cells": [
                    _percent_cell(result),
                    _count_cell(result.get("numerator")),
                    _count_cell(result.get("denominator")),
                ],
            }
        )
    totals = ind.population_totals(rows)
    table_rows.append(
        {
            "label": "Working-age population (weighted)",
            "cells": [
                _count_cell(totals["weighted_working_age"]),
                _count_cell(totals["weighted_labour_force"]),
                _count_cell(totals["weighted_employed"]),
            ],
        }
    )
    return {
        "columns": ["Estimate", "Labour force (weighted)", "Employed (weighted)"],
        "rows": table_rows,
        "unit": "percent",
    }


def by_sex(rows: list[dict], spec: dict) -> dict:
    rows = _filter_rows(rows, spec.get("filters"))
    groups = [
        ("Male", [r for r in rows if r.get("sex") == "Male"]),
        ("Female", [r for r in rows if r.get("sex") == "Female"]),
        ("Total", rows),
    ]
    return {
        "columns": [label for label, _ in groups],
        "rows": _rows_for_indicators(groups, spec.get("indicators") or []),
        "unit": "percent",
    }


def by_youth(rows: list[dict], spec: dict) -> dict:
    youth = [r for r in rows if ind.is_youth(r)]
    adult = [r for r in rows if ind.is_working_age(r) and not ind.is_youth(r)]
    groups = [
        (f"Youth ({WORKING_AGE_MIN}-{YOUTH_MAX})", youth),
        (f"Adults ({YOUTH_MAX + 1}+)", adult),
        ("Total", rows),
    ]
    return {
        "columns": [label for label, _ in groups],
        "rows": _rows_for_indicators(groups, spec.get("indicators") or []),
        "unit": "percent",
    }


def by_youth_sex(rows: list[dict], spec: dict) -> dict:
    groups = [
        ("Youth male", [r for r in rows if ind.is_youth(r) and r.get("sex") == "Male"]),
        ("Youth female", [r for r in rows if ind.is_youth(r) and r.get("sex") == "Female"]),
        (
            "Adult male",
            [r for r in rows if ind.is_working_age(r) and not ind.is_youth(r) and r.get("sex") == "Male"],
        ),
        (
            "Adult female",
            [r for r in rows if ind.is_working_age(r) and not ind.is_youth(r) and r.get("sex") == "Female"],
        ),
    ]
    return {
        "columns": [label for label, _ in groups],
        "rows": _rows_for_indicators(groups, spec.get("indicators") or []),
        "unit": "percent",
    }


def _age_band(age: int) -> str | None:
    for low, high, label in AGE_BANDS:
        if low <= age <= high:
            return label
    return None


def by_age(rows: list[dict], spec: dict) -> dict:
    codes = spec.get("indicators") or []
    table_rows = []
    for _, _, label in AGE_BANDS:
        subset = [r for r in rows if _age_band(ind.age_of(r)) == label]
        table_rows.append(
            {
                "label": label,
                "cells": [_percent_cell(ind.evaluate(subset, code)) for code in codes],
            }
        )
    return {
        "columns": [INDICATORS[code]["short"] for code in codes],
        "rows": table_rows,
        "unit": "percent",
    }


def by_age_sex(rows: list[dict], spec: dict) -> dict:
    codes = spec.get("indicators") or ["LFPR", "UR1"]
    columns = []
    for code in codes:
        for sex in ("Male", "Female", "Total"):
            columns.append(f"{INDICATORS[code]['short']} · {sex}")
    table_rows = []
    for _, _, label in AGE_BANDS:
        band_rows = [r for r in rows if _age_band(ind.age_of(r)) == label]
        cells = []
        for code in codes:
            cells.append(_percent_cell(ind.evaluate([r for r in band_rows if r.get("sex") == "Male"], code)))
            cells.append(_percent_cell(ind.evaluate([r for r in band_rows if r.get("sex") == "Female"], code)))
            cells.append(_percent_cell(ind.evaluate(band_rows, code)))
        table_rows.append({"label": label, "cells": cells})
    return {"columns": columns, "rows": table_rows, "unit": "percent"}


def by_education_sex(rows: list[dict], spec: dict) -> dict:
    codes = spec.get("indicators") or ["LFPR", "UR1"]
    columns = []
    for code in codes:
        for sex in ("Male", "Female"):
            columns.append(f"{INDICATORS[code]['short']} · {sex}")
    table_rows = []
    for level in EDUCATION_LEVELS:
        level_rows = [r for r in rows if r.get("education") == level]
        cells = []
        for code in codes:
            cells.append(_percent_cell(ind.evaluate([r for r in level_rows if r.get("sex") == "Male"], code)))
            cells.append(_percent_cell(ind.evaluate([r for r in level_rows if r.get("sex") == "Female"], code)))
        table_rows.append({"label": level, "cells": cells})
    return {"columns": columns, "rows": table_rows, "unit": "percent"}


def subsistence(rows: list[dict], spec: dict) -> dict:
    employed = [r for r in rows if ind.is_employed(r)]
    subsist = [r for r in employed if ind.is_subsistence(r)]
    other = [r for r in employed if not ind.is_subsistence(r)]

    def share(subset: list[dict], group: list[dict]) -> dict:
        return _percent_cell(ind.ratio(ind.wsum(subset), ind.wsum(group)))

    table_rows = []
    for label, subset in (
        ("Subsistence agriculture", subsist),
        ("Other employment", other),
        ("All employed", employed),
    ):
        table_rows.append(
            {
                "label": label,
                "cells": [
                    share(subset, [r for r in employed if r.get("sex") == "Male"]),
                    share(subset, [r for r in employed if r.get("sex") == "Female"]),
                    share(subset, employed),
                ],
            }
        )
    return {
        "columns": ["Male", "Female", "Total"],
        "rows": table_rows,
        "unit": "percent",
    }


def share(rows: list[dict], spec: dict) -> dict:
    grouping = spec.get("grouping")
    employed = [r for r in rows if ind.is_employed(r)]
    total = ind.wsum(employed)
    categories: list[str] = []
    for row in employed:
        value = row.get(grouping)
        if value and value not in categories and value != "Not applicable":
            categories.append(value)
    scored = []
    for category in categories:
        subset = [r for r in employed if r.get(grouping) == category]
        weighted = ind.wsum(subset)
        scored.append(
            (
                category,
                subset,
                weighted,
                (100.0 * weighted / total) if total else None,
            )
        )
    scored.sort(key=lambda item: item[2], reverse=True)
    table_rows = []
    for category, _, weighted, pct in scored:
        table_rows.append(
            {
                "label": category,
                "cells": [
                    {
                        "value": round(pct, 2) if pct is not None else None,
                        "display": _fmt(pct),
                        "numerator": round(weighted, 1),
                        "denominator": round(total, 1),
                    },
                    _count_cell(weighted),
                ],
            }
        )
    return {
        "columns": ["Share of employment (%)", "Weighted persons"],
        "rows": table_rows,
        "unit": "percent",
    }


def by_district(rows: list[dict], spec: dict) -> dict:
    districts = sorted({r.get("district") for r in rows if r.get("district")})
    scored = []
    for district in districts:
        subset = [r for r in rows if r.get("district") == district]
        lfpr = ind.evaluate(subset, "LFPR")
        epr = ind.evaluate(subset, "EPR")
        ur1 = ind.evaluate(subset, "UR1")
        scored.append((district, subset, lfpr, epr, ur1))
    scored.sort(key=lambda item: (item[2]["value"] or 0), reverse=True)
    table_rows = []
    for district, subset, lfpr, epr, ur1 in scored:
        table_rows.append(
            {
                "label": district,
                "cells": [
                    _percent_cell(lfpr),
                    _percent_cell(epr),
                    _percent_cell(ur1),
                    _count_cell(ind.wsum(subset, ind.is_working_age)),
                ],
            }
        )
    return {
        "columns": ["LFPR", "EPR", "UR1", "Working-age pop. (weighted)"],
        "rows": table_rows,
        "unit": "percent",
    }


BUILDERS = {
    "national_summary": national_summary,
    "by_sex": by_sex,
    "by_youth": by_youth,
    "by_youth_sex": by_youth_sex,
    "by_age": by_age,
    "by_age_sex": by_age_sex,
    "by_education_sex": by_education_sex,
    "subsistence": subsistence,
    "share": share,
    "by_district": by_district,
}


def produce_table(spec: dict, rows: list[dict]) -> dict:
    builder_name = spec.get("builder")
    builder = BUILDERS.get(builder_name) if builder_name else None
    if builder is None:
        return {
            "id": spec["id"],
            "chapter": spec["chapter"],
            "title": spec["title"],
            "implemented": False,
            "columns": [],
            "rows": [],
            "notes": spec.get("notes", "Producer not implemented yet."),
        }
    payload = builder(rows, spec)
    return {
        "id": spec["id"],
        "chapter": spec["chapter"],
        "title": spec["title"],
        "implemented": True,
        "notes": spec.get("notes", ""),
        "indicators": spec.get("indicators", []),
        "filters": spec.get("filters", {}),
        **payload,
    }
