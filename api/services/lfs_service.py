import json
import logging
import os
import sys
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from labour_analytics.config import Config
from labour_analytics.harmonizer import build_master_panel
from labour_analytics.indicators import compute_all_indicators
from labour_analytics.table_engine import (
    TABLE_CATALOGUE,
    produce_tables,
    table_catalogue_payload,
)
from labour_analytics.validation import ValidationEngine

logger = logging.getLogger(__name__)
_pipeline_cache = None
_pipeline_logs = deque(maxlen=200)


def _log(message: str):
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] {message}"
    _pipeline_logs.append(entry)
    logger.info(message)


def _normalise_year(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(str(value).strip())
    except ValueError:
        return None


def _filter_panel(data: pd.DataFrame, *, year: int | None = None, sex: str | None = None, area: str | None = None) -> pd.DataFrame:
    filtered = data.copy()
    if year is not None:
        filtered = filtered[filtered["survey_year"] == year].copy()
    if sex:
        sex_key = str(sex).strip().lower()
        if "sex" in filtered.columns:
            filtered = filtered[filtered["sex"].astype(str).str.lower() == sex_key]
        elif "A01" in filtered.columns:
            mapping = {"male": 1, "female": 2}
            target = mapping.get(sex_key)
            if target is not None:
                filtered = filtered[filtered["A01"] == target]
    if area:
        area_key = str(area).strip().lower()
        if "urban_rural" in filtered.columns:
            values = filtered["urban_rural"].astype(str).str.strip().str.lower()
            values = values.replace({"1": "urban", "1.0": "urban", "2": "rural", "2.0": "rural"})
            filtered = filtered[values == area_key]
        elif "Code_UR" in filtered.columns:
            values = filtered["Code_UR"].astype(str).str.strip().str.lower()
            values = values.replace({"1": "urban", "1.0": "urban", "2": "rural", "2.0": "rural"})
            filtered = filtered[values == area_key]
    return filtered


def _panel_summary(frame: pd.DataFrame) -> dict[str, Any]:
    if frame.empty:
        return {
            "wap": 0.0,
            "labour_force": 0.0,
            "employed": 0.0,
            "unemployed": 0.0,
            "outside_lf": 0.0,
            "lfpr": 0.0,
            "epr": 0.0,
            "unemployment_rate": 0.0,
        }

    weight = next((column for column in ("weight", "weight2", "Weight") if column in frame.columns), None)
    if weight is None:
        raise ValueError("The analytic panel does not contain a survey weight column.")
    wap = float(frame.loc[frame.get("wap16", 1) == 1, weight].sum()) if "wap16" in frame.columns else float(frame[weight].sum())
    employed = float(frame.loc[frame.get("lf_status", 0) == 1, weight].sum()) if "lf_status" in frame.columns else 0.0
    unemployed = float(frame.loc[frame.get("lf_status", 0) == 2, weight].sum()) if "lf_status" in frame.columns else 0.0
    outside_lf = float(frame.loc[frame.get("lf_status", 0) == 3, weight].sum()) if "lf_status" in frame.columns else max(wap - employed - unemployed, 0.0)
    labour_force = employed + unemployed
    lfpr = (labour_force / wap) * 100 if wap else 0.0
    epr = (employed / wap) * 100 if wap else 0.0
    unemployment_rate = (unemployed / labour_force) * 100 if labour_force else 0.0

    return {
        "wap": wap,
        "labour_force": labour_force,
        "employed": employed,
        "unemployed": unemployed,
        "outside_lf": outside_lf,
        "lfpr": lfpr,
        "epr": epr,
        "unemployment_rate": unemployment_rate,
    }


def _dashboard_metrics(frame: pd.DataFrame) -> dict[str, Any]:
    summary = _panel_summary(frame)
    if frame.empty:
        return {**summary, "youth_population": 0.0, "youth_unemployment_rate": 0.0, "lu2": None, "lu3": None, "luur": None}

    weight = next((column for column in ("weight", "weight2", "Weight") if column in frame.columns), None)
    if weight is None:
        raise ValueError("The analytic panel does not contain a survey weight column.")
    wap = frame.loc[frame["wap16"] == 1] if "wap16" in frame.columns else frame.loc[frame["age"] >= 16]
    youth = wap.loc[wap["age"].between(16, 30)]
    youth_employed = youth.loc[youth["lf_status"] == 1, weight].sum()
    youth_unemployed = youth.loc[youth["lf_status"] == 2, weight].sum()
    youth_lf = youth_employed + youth_unemployed

    metrics = {
        **summary,
        "youth_population": float(youth[weight].sum()),
        "youth_unemployment_rate": float(100 * youth_unemployed / youth_lf) if youth_lf else 0.0,
        "lu2": None,
        "lu3": None,
        "luur": None,
        "informality_rate": None,
    }
    informal_column = next((column for column in ("informal_flag",) if column in frame.columns), None)
    if informal_column is not None:
        employed = wap.loc[wap["lf_status"] == 1]
        employed_total = employed[weight].sum()
        informal_total = employed.loc[employed[informal_column] == 1, weight].sum()
        metrics["informality_rate"] = float(100 * informal_total / employed_total) if employed_total else None

    if "plf_status" in wap.columns and "tru" in wap.columns:
        employed_total = wap.loc[wap["lf_status"] == 1, weight].sum()
        unemployed = wap.loc[wap["lf_status"] == 2, weight].sum()
        labour_force = employed_total + unemployed
        potential = wap.loc[wap["plf_status"] == 1, weight].sum()
        time_related = wap.loc[wap["tru"] == 1, weight].sum()
        extended = labour_force + potential
        metrics["lu2"] = float(100 * (unemployed + time_related) / labour_force) if labour_force else None
        metrics["lu3"] = float(100 * (unemployed + potential) / extended) if extended else None
        metrics["luur"] = float(100 * (unemployed + time_related + potential) / extended) if extended else None
    return metrics


def _dashboard_groups(frame: pd.DataFrame, column: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    if column not in frame.columns:
        return []
    groups = []
    for value, group in frame.groupby(column, dropna=False, observed=True, sort=True):
        label = str(value) if pd.notna(value) else "Missing"
        if column == "A01":
            label = {"1": "Male", "2": "Female", "1.0": "Male", "2.0": "Female"}.get(label, label)
        elif column == "urban_rural":
            label = {"1": "Urban", "2": "Rural", "1.0": "Urban", "2.0": "Rural"}.get(label, label)
        groups.append({"label": label, **_dashboard_metrics(group)})
    if limit is not None:
        groups = sorted(groups, key=lambda row: row["wap"], reverse=True)[:limit]
    return groups


def get_dashboard_summary(
    year: int | None = None,
    sex: str | None = None,
    area: str | None = None,
    age_group: str | None = None,
    province: str | None = None,
) -> dict[str, Any]:
    panel = _ensure_pipeline()
    trend_frame = _filter_panel(panel, sex=sex, area=area)
    filtered = trend_frame.copy()
    if age_group:
        if age_group == "youth":
            filtered = filtered.loc[filtered["age"].between(16, 30)]
            trend_frame = trend_frame.loc[trend_frame["age"].between(16, 30)]
        elif age_group == "adult":
            filtered = filtered.loc[filtered["age"] >= 31]
            trend_frame = trend_frame.loc[trend_frame["age"] >= 31]
    if province and "province" in filtered.columns:
        filtered = filtered.loc[filtered["province"].astype(str) == str(province)]
        trend_frame = trend_frame.loc[trend_frame["province"].astype(str) == str(province)]
    if year is not None:
        filtered = filtered.loc[filtered["survey_year"] == year]

    trends = [
        {"year": int(wave_year), **_dashboard_metrics(wave)}
        for wave_year, wave in trend_frame.groupby("survey_year", sort=True)
    ]
    years = sorted(panel["survey_year"].dropna().astype(int).unique().tolist())
        selected_year = year or (years[-1] if years else None)
        latest = filtered.loc[filtered["survey_year"] == selected_year] if selected_year is not None else filtered
        latest_age = latest.copy()
        latest_age["age_group"] = pd.cut(
            latest_age["age"],
            bins=[16, 25, 35, 45, 55, float("inf")],
            labels=["16-24", "25-34", "35-44", "45-54", "55+"],
            right=False,
        )
    selected_year = year or (years[-1] if years else None)
    latest = filtered.loc[filtered["survey_year"] == selected_year] if selected_year is not None else filtered
    return {
        "success": True,
        "data": {
            "dataset": "Rwanda LFS harmonized microdata",
            "mode": "production",
            "source": "raw/RW_LFS*.dta via final/RLFS_Harmonized_2020_2025.parquet",
                "source_records": int(len(latest)),
            "selected_year": selected_year,
            "source_records": int(len(latest)),
                "summary": _dashboard_metrics(latest),
            "filters": {"year": year, "sex": sex, "area": area, "age_group": age_group, "province": province},
                "by_sex": _dashboard_groups(latest, "A01"),
                "by_area": _dashboard_groups(latest, "urban_rural"),
                "by_age_group": _dashboard_groups(latest_age, "age_group"),
                "by_province": _dashboard_groups(latest, "province", limit=10),
                "employment_by_sector": _dashboard_groups(latest.loc[latest["lf_status"] == 1], "main_sect", limit=8)
                if "main_sect" in latest.columns
                labels=["16-24", "25-34", "35-44", "45-54", "55+"], right=False,
            )), "age_group"),
            "by_province": _dashboard_groups(latest, "province", limit=10),
            "employment_by_sector": _dashboard_groups(latest.loc[latest["lf_status"] == 1], "main_sect", limit=8)
            if "main_sect" in latest.columns
            else [],
        },
    }


def _ensure_pipeline() -> pd.DataFrame:
    global _pipeline_cache
    if _pipeline_cache is None:
        cache_path = Config.FINAL_PARQUET
        if os.path.exists(cache_path):
            try:
                _pipeline_cache = pd.read_parquet(cache_path)
                required = {"survey_year", "age", "weight", "wap16", "lf_status"}
                missing = sorted(required.difference(_pipeline_cache.columns))
                if missing:
                    raise ValueError(f"Harmonized panel is missing columns: {', '.join(missing)}")
                _log(f"Pipeline: loaded cached harmonized panel ({len(_pipeline_cache)} records)")
            except Exception as exc:
                _log(f"Pipeline: harmonized cache unusable; rebuilding from raw waves ({exc})")
                _pipeline_cache = None

        if _pipeline_cache is None:
            _log("Pipeline: starting build_master_panel")
            _pipeline_cache = build_master_panel()
            _log(f"Pipeline: master_panel built with {len(_pipeline_cache)} records")
            _log("Pipeline: starting compute_all_indicators")
            _pipeline_cache = compute_all_indicators(_pipeline_cache)
            _log("Pipeline: indicators computed; writing harmonized cache")
            _pipeline_cache.to_parquet(cache_path, index=False)
    return _pipeline_cache


def get_indicators(year: int | None = None, sex: str | None = None, area: str | None = None) -> dict[str, Any]:
    panel = _ensure_pipeline()
    filtered = _filter_panel(panel, year=year, sex=sex, area=area)
    summary = _panel_summary(filtered)
    return {
        "success": True,
        "year": year,
        "filters": {"sex": sex, "area": area},
        "data": summary,
        "records": int(len(filtered)),
    }


def get_metadata() -> dict[str, Any]:
    panel = _ensure_pipeline()
    columns = list(panel.columns)
    years = sorted(pd.Series(panel["survey_year"]).dropna().astype(int).unique().tolist())
    return {
        "success": True,
        "data": {
            "dataset": "Rwanda LFS harmonized microdata",
            "production_mode": "production",
            "production_note": "Statistics are computed from the harmonized Rwanda LFS source panel. Publication approval and release-specific methodological checks remain required.",
            "years": years,
            "records": int(len(panel)),
            "columns": columns,
            "required_columns": ["survey_year", "age", "sex", "weight", "lf_status"],
            "source_inventory_file": "final/lfs_production_catalogue.json",
            "coverage_matrix_file": "final/lfs_coverage_matrix.json",
            "table_catalogue": table_catalogue_payload(),
        },
    }


def get_tables(year: int | None = None) -> dict[str, Any]:
    panel = _ensure_pipeline()
    filtered = _filter_panel(panel, year=year)
    if filtered.empty:
        return {"success": True, "data": {"tables": {}, "year": year}}

    table_run = produce_tables(filtered)
    records_by_id = table_run.as_records()
    tables = {
        definition.output_key: records_by_id[definition.table_id]
        for definition in TABLE_CATALOGUE
    }

    return {
        "success": True,
        "data": {
            "tables": tables,
            "year": year,
            "years": list(table_run.years),
            "source_records": table_run.source_records,
            "weight_column": table_run.weight_column,
        },
    }


def get_publication_tables(year: int | None = None) -> dict[str, Any]:
    return get_tables(year=year)


def get_validation_status() -> dict[str, Any]:
    try:
        engine = ValidationEngine()
        passed = bool(engine.run_full_audit())
        return {"success": True, "data": {"passed": passed}}
    except Exception as exc:  # pragma: no cover
        return {"success": False, "data": {"passed": False, "error": str(exc)}}


def get_excel_report(report_name: str) -> str | None:
    safe_name = str(report_name).strip()
    if not safe_name:
        return None
    base = Config.FOLDERS.get("final", os.path.join(PROJECT_ROOT, "final"))
    candidates = [
        os.path.join(base, safe_name),
        os.path.join(base, safe_name + ".xlsx"),
        os.path.join(base, f"{safe_name}.xls"),
        os.path.join(base, "Rwanda_LFS_2020_2025_Master_Report.xlsx"),
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    return None


def get_viz_dataset(dataset_name: str) -> Any:
    if not dataset_name:
        raise FileNotFoundError("No visualisation dataset was provided")

    base_dir = Path(Config.FOLDERS.get("viz", os.path.join(Config.FOLDERS["final"], "viz")))
    candidates = [
        base_dir / dataset_name,
        base_dir / f"{dataset_name}.csv",
        base_dir / f"{dataset_name}.parquet",
        Path(Config.FOLDERS["final"]) / dataset_name,
        Path(Config.FOLDERS["final"]) / f"{dataset_name}.csv",
        Path(Config.FOLDERS["final"]) / f"{dataset_name}.parquet",
    ]
    for candidate in candidates:
        if candidate.exists():
            if candidate.suffix.lower() == ".csv":
                return pd.read_csv(candidate).to_dict(orient="records")
            if candidate.suffix.lower() == ".parquet":
                return pd.read_parquet(candidate).to_dict(orient="records")
            return json.loads(candidate.read_text(encoding="utf-8"))
    raise FileNotFoundError(f"Dataset not found: {dataset_name}")


def get_pipeline_logs() -> dict[str, Any]:
    return {"success": True, "data": {"logs": list(_pipeline_logs)}}


def process_uploaded_file(filename: str, records: list[dict[str, Any]]) -> dict[str, Any]:
    if not records:
        raise ValueError("No records provided")

    frame = pd.DataFrame(records)
    if frame.empty:
        raise ValueError("Uploaded dataset is empty")

    lower_name = str(filename).lower()
    if lower_name.endswith(".dta"):
        suffix = "dta"
    elif lower_name.endswith(".csv"):
        suffix = "csv"
    elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
        suffix = "excel"
    else:
        suffix = "unknown"

    if "weight" not in frame.columns:
        for candidate in ["Weight", "weight2"]:
            if candidate in frame.columns:
                frame.rename(columns={candidate: "weight"}, inplace=True)
    if "A01" in frame.columns and "sex" not in frame.columns:
        frame["sex"] = frame["A01"].map({1: "male", 2: "female"})
    if "Code_UR" in frame.columns and "urban_rural" not in frame.columns:
        frame["urban_rural"] = frame["Code_UR"].map({1: "urban", 2: "rural"})

    frame["weight"] = pd.to_numeric(frame.get("weight", 0), errors="coerce")
    frame["year"] = pd.to_numeric(frame.get("year", 0), errors="coerce")
    frame["quarter"] = pd.to_numeric(frame.get("quarter", 1), errors="coerce")
    frame["age"] = pd.to_numeric(frame.get("age", 0), errors="coerce")

    return {
        "success": True,
        "data": {
            "filename": filename,
            "file_type": suffix,
            "rows_ingested": int(len(frame)),
            "columns": list(frame.columns),
            "preview": frame.head(5).to_dict(orient="records"),
            "status": "accepted",
        },
    }
