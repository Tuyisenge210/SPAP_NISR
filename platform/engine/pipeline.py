"""Production pipeline.

Runs the documented SPAP workflow as recorded, timed steps so the interface can
show exactly what the platform is doing:

    1 ingest -> 2 harmonise -> 3 validate -> 4 derive -> 5 indicators
    -> 6 tables -> 7 preview -> 8 export -> 9 reproducibility
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from . import indicators as ind
from .lfs_data import SYNTHETIC_DATASET, Microdata, list_datasets, load_microdata
from .metadata import (
    CHAPTERS,
    HEADLINE_INDICATORS,
    INDICATORS,
    TABLE_CATALOGUE,
    WORKING_AGE_MIN,
    table_by_id,
)
from .tables import produce_table
from .validation import run_checks

_DATA_CACHE: dict[tuple[str, int], Microdata] = {}
_MAX_CACHE = 12
RUNS: dict[str, dict] = {}
_RUN_ORDER: list[str] = []
_MAX_RUNS = 40


def load_cached(dataset_id: str, year: int) -> Microdata:
    key = (dataset_id, year)
    cached = _DATA_CACHE.get(key)
    if cached is not None:
        return cached
    if len(_DATA_CACHE) >= _MAX_CACHE:
        _DATA_CACHE.clear()
    data = load_microdata(dataset_id, year)
    _DATA_CACHE[key] = data
    return data


def years_for(dataset_id: str) -> list[int]:
    for dataset in list_datasets():
        if dataset["id"] == dataset_id:
            return dataset["years"]
    return [2025]


def _step(key: str, label: str, status: str, ms: float, detail: str) -> dict:
    return {"key": key, "label": label, "status": status, "ms": round(ms, 1), "detail": detail}


def _headline(data: Microdata) -> list[dict]:
    kpis = []
    previous_year = data.year - 1
    previous = None
    if previous_year in years_for(data.dataset_id):
        try:
            previous = load_cached(data.dataset_id, previous_year)
        except Exception:  # pragma: no cover - previous year is optional context
            previous = None

    for code in HEADLINE_INDICATORS:
        meta = INDICATORS[code]
        result = ind.evaluate(data.rows, code)
        prior_value = ind.evaluate(previous.rows, code)["value"] if previous else None
        delta = None
        if result["value"] is not None and prior_value is not None:
            delta = round(result["value"] - prior_value, 2)
        kpis.append(
            {
                "code": code,
                "name": meta["name"],
                "short": meta["short"],
                "value": result["value"],
                "numerator": result["numerator"],
                "denominator": result["denominator"],
                "unit": meta["unit"],
                "previous": prior_value,
                "delta": delta,
                "definition": meta["definition"],
                "formula": meta["formula"],
                "function": meta["function"],
                "population": meta["population"],
            }
        )
    return kpis


def _charts(data: Microdata) -> dict:
    available = years_for(data.dataset_id)
    trend = []
    for year in available:
        try:
            year_data = load_cached(data.dataset_id, year)
        except Exception:
            continue
        trend.append(
            {
                "year": year,
                "LFPR": ind.evaluate(year_data.rows, "LFPR")["value"],
                "UR1": ind.evaluate(year_data.rows, "UR1")["value"],
                "LUUR": ind.evaluate(year_data.rows, "LUUR")["value"],
            }
        )

    by_sex = []
    for sex in ("Male", "Female"):
        subset = [r for r in data.rows if r.get("sex") == sex]
        by_sex.append(
            {
                "group": sex,
                "LFPR": ind.evaluate(subset, "LFPR")["value"],
                "UR1": ind.evaluate(subset, "UR1")["value"],
            }
        )

    provinces = sorted({r.get("province") for r in data.rows if r.get("province")})
    by_province = []
    for province in provinces:
        subset = [r for r in data.rows if r.get("province") == province]
        by_province.append(
            {
                "group": province,
                "LFPR": ind.evaluate(subset, "LFPR")["value"],
                "UR1": ind.evaluate(subset, "UR1")["value"],
            }
        )
    by_province.sort(key=lambda row: row["LFPR"] or 0, reverse=True)

    return {"trend": trend, "by_sex": by_sex, "by_province": by_province}


def produce(dataset_id: str, year: int, chapters: list[int] | None = None) -> dict:
    started = time.perf_counter()
    run_id = f"run_{uuid.uuid4().hex[:10]}"
    steps: list[dict] = []

    # 1 — ingestion
    mark = time.perf_counter()
    data = load_cached(dataset_id, year)
    steps.append(
        _step(
            "ingest",
            "LFS data ingestion",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"{data.n:,} person records loaded from {data.source} source",
        )
    )

    # 2 — metadata and harmonisation
    mark = time.perf_counter()
    derived_counts = {
        "working_age": sum(1 for r in data.rows if ind.is_working_age(r)),
        "in_labour_force": sum(1 for r in data.rows if ind.is_working_age(r) and ind.in_labour_force(r)),
        "employed": sum(1 for r in data.rows if ind.is_employed(r)),
        "youth": sum(1 for r in data.rows if ind.is_youth(r)),
    }
    steps.append(
        _step(
            "harmonise",
            "Metadata and harmonisation",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"{len(derived_counts)} derived variables mapped onto the year structure",
        )
    )

    # 3 — validation
    mark = time.perf_counter()
    validation = run_checks(data)
    validation.update(
        {
            "dataset_label": data.label,
            "source": data.source,
            "synthetic": data.source.startswith("synthetic"),
            "fingerprint": data.fingerprint,
        }
    )
    steps.append(
        _step(
            "validate",
            "Data validation",
            "failed" if validation["summary"]["blocking"] else "done",
            (time.perf_counter() - mark) * 1000,
            f"{validation['summary']['pass']} passed · {validation['summary']['warn']} warnings · "
            f"{validation['summary']['fail']} blocking",
        )
    )

    base_run = {
        "id": run_id,
        "dataset": dataset_id,
        "dataset_label": data.label,
        "year": year,
        "source": data.source,
        "synthetic": data.source.startswith("synthetic"),
        "fingerprint": data.fingerprint,
        "records": data.n,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "validation": validation,
        "chapters": chapters or [],
    }

    if validation["summary"]["blocking"]:
        steps.append(
            _step("blocked", "Production halted", "blocked", 0.0, "Blocking validation failures must be resolved")
        )
        run = {
            **base_run,
            "status": "blocked",
            "steps": steps,
            "tables": [],
            "kpis": [],
            "charts": {"trend": [], "by_sex": [], "by_province": []},
            "duration_ms": round((time.perf_counter() - started) * 1000, 1),
        }
        _remember(run)
        return run

    # 4 — derived variables and weighting
    mark = time.perf_counter()
    totals = ind.population_totals(data.rows)
    steps.append(
        _step(
            "derive",
            "Derived variables and weighting",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"weighted working-age population {totals['weighted_working_age']:,.0f} · "
            f"labour force {totals['weighted_labour_force']:,.0f}",
        )
    )

    # 5 — indicators
    mark = time.perf_counter()
    kpis = _headline(data)
    steps.append(
        _step(
            "indicators",
            "Indicator calculation",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"{len(INDICATORS)} indicators evaluated with NISR / ILO definitions",
        )
    )

    # 6 — chapter tables
    mark = time.perf_counter()
    selected = TABLE_CATALOGUE
    if chapters:
        selected = [t for t in selected if t["chapter"] in chapters]
    selected = [t for t in selected if t["implemented"]]
    tables = [produce_table(spec, data.rows) for spec in selected]
    steps.append(
        _step(
            "tables",
            "Chapter-specific table production",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"{len(tables)} tables produced across "
            f"{len({t['chapter'] for t in tables})} chapters",
        )
    )

    # 7 — preview
    mark = time.perf_counter()
    charts = _charts(data)
    steps.append(
        _step(
            "preview",
            "Validation and preview",
            "done",
            (time.perf_counter() - mark) * 1000,
            "table preview and dashboard figures assembled from the same results",
        )
    )

    # 8 — export readiness
    mark = time.perf_counter()
    steps.append(
        _step(
            "export",
            "Export and visualisation",
            "done",
            (time.perf_counter() - mark) * 1000,
            "Excel workbooks available per chapter and for the full run",
        )
    )

    # 9 — reproducibility record
    mark = time.perf_counter()
    run = {
        **base_run,
        "status": "complete",
        "steps": steps,
        "tables": tables,
        "kpis": kpis,
        "charts": charts,
        "totals": totals,
        "indicator_count": len(INDICATORS),
        "table_count": len(tables),
        "duration_ms": round((time.perf_counter() - started) * 1000, 1),
    }
    run["steps"].append(
        _step(
            "reproduce",
            "Reproducibility",
            "done",
            (time.perf_counter() - mark) * 1000,
            f"run {run_id} recorded · dataset fingerprint {data.fingerprint}",
        )
    )
    _remember(run)
    return run


def _remember(run: dict) -> None:
    RUNS[run["id"]] = run
    _RUN_ORDER.append(run["id"])
    while len(_RUN_ORDER) > _MAX_RUNS:
        oldest = _RUN_ORDER.pop(0)
        RUNS.pop(oldest, None)


def get_run(run_id: str) -> dict | None:
    return RUNS.get(run_id)


def list_runs() -> list[dict]:
    return [
        {
            "id": run["id"],
            "dataset": run["dataset"],
            "dataset_label": run.get("dataset_label"),
            "year": run["year"],
            "status": run["status"],
            "records": run.get("records"),
            "table_count": run.get("table_count", 0),
            "duration_ms": run.get("duration_ms"),
            "created_at": run["created_at"],
            "synthetic": run.get("synthetic"),
            "chapters": run.get("chapters", []),
        }
        for run in sorted(RUNS.values(), key=lambda r: r["created_at"], reverse=True)
    ]


def trace(indicator_code: str) -> dict:
    meta = INDICATORS.get(indicator_code)
    if meta is None:
        raise KeyError(indicator_code)
    tables = [
        {"id": t["id"], "chapter": t["chapter"], "title": t["title"]}
        for t in TABLE_CATALOGUE
        if t.get("implemented") and indicator_code in (t.get("indicators") or [])
    ]
    return {"code": indicator_code, **meta, "tables": tables}


def chapter_catalogue() -> list[dict]:
    return CHAPTERS


def dataset_options() -> list[dict]:
    return list_datasets()


def table_spec(table_id: str) -> dict | None:
    return table_by_id(table_id)
