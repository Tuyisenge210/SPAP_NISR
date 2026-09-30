import json
import logging
import os
import sys
from collections import deque
from datetime import datetime

import pandas as pd

# Ensure the project root is on the Python path for labour_analytics imports
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from labour_analytics.config import Config
from labour_analytics.harmonizer import build_master_panel
from labour_analytics.indicators import compute_all_indicators

logger = logging.getLogger(__name__)
_pipeline_cache = None
_pipeline_logs = deque(maxlen=200)


def _log(message: str):
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] {message}"
    _pipeline_logs.append(entry)
    logger.info(message)


def _dataset_status_summary():
    available_files = []
    for year in Config.YEARS:
        path = os.path.join(Config.FOLDERS["raw"], f"RW_LFS{year}.dta")
        if os.path.exists(path):
            available_files.append({"year": year, "file": os.path.basename(path)})

    return {
        "available_waves": available_files,
        "status": "ready" if available_files else "missing_raw_data",
        "message": (
            "Raw LFS data files are available."
            if available_files
            else "No raw LFS data files were found in the configured raw folder."
        ),
    }


def _ensure_pipeline():
    global _pipeline_cache
    if _pipeline_cache is None:
        _log("Pipeline: starting build_master_panel")
        try:
            _pipeline_cache = build_master_panel()
            _log(f"Pipeline: master_panel built with {len(_pipeline_cache)} records")
            _log("Pipeline: starting compute_all_indicators")
            _pipeline_cache = compute_all_indicators(_pipeline_cache)
            _log("Pipeline: indicators computed")
        except FileNotFoundError:
            _log("Pipeline: raw LFS microdata is unavailable in the configured raw folder.")
            _pipeline_cache = pd.DataFrame()
    return _pipeline_cache


def get_pipeline_logs():
    return {"logs": list(_pipeline_logs), "count": len(_pipeline_logs)}


def get_metadata():
    summary = _dataset_status_summary()
    return {
        "status": summary["status"],
        "message": summary["message"],
        "years": Config.YEARS,
        "raw_folder": Config.FOLDERS["raw"],
        "final_folder": Config.FOLDERS["final"],
        "wave_files": summary["available_waves"],
        "rename_dictionary": {k: v for k, v in Config.RENAME_DICTIONARY.items()},
        "requires_confirmation": not summary["available_waves"],
    }


def get_indicators(year: int | None = None, sex: str | None = None, area: str | None = None):
    panel = _ensure_pipeline()
    if panel.empty:
        return {
            "status": "missing_data",
            "message": "Raw LFS data are not available in the configured data folder. The platform requires the official LFS wave files before indicator values can be computed.",
            "indicators": [],
        }

    if year is not None:
        panel = panel[panel.get("survey_year") == year]
    if sex is not None:
        panel = panel[panel.get("A01") == sex]
    if area is not None:
        panel = panel[panel.get("urban_rural") == area]

    if panel.empty:
        return {"status": "empty_result", "message": "No records match the selected filters.", "indicators": []}

    total_wap = float(panel["weight"].sum()) if "weight" in panel.columns else 0.0
    employed = float(panel.loc[panel["lf_status"] == 1, "weight"].sum()) if "lf_status" in panel.columns else 0.0
    unemployed = float(panel.loc[panel["lf_status"] == 2, "weight"].sum()) if "lf_status" in panel.columns else 0.0
    lf_total = employed + unemployed
    lfpr = (lf_total / total_wap * 100.0) if total_wap else 0.0
    ur = (unemployed / lf_total * 100.0) if lf_total else 0.0

    indicators = {
        "total_wap": total_wap,
        "labour_force": lf_total,
        "employed": employed,
        "unemployed": unemployed,
        "lfpr_pct": round(lfpr, 2),
        "unemployment_rate_pct": round(ur, 2),
        "year": year,
        "sex": sex,
        "area": area,
        "source": "python_lfs_pipeline",
    }
    return {"status": "ok", "indicators": [indicators], "summary": indicators}


def get_tables(year: int | None = None):
    panel = _ensure_pipeline()
    if panel.empty:
        return {
            "status": "missing_data",
            "message": "No validated LFS microdata available. Standard tables cannot be generated until raw wave files are supplied.",
            "tables": [],
        }

    if year is not None:
        panel = panel[panel.get("survey_year") == year]

    table = []
    if "lf_status" in panel.columns and "weight" in panel.columns:
        by_status = panel.groupby("lf_status")["weight"].sum().to_dict()
        for key, value in sorted(by_status.items()):
            table.append({"lf_status": int(key), "weighted_population": float(value)})

    return {"status": "ok", "year": year, "tables": table}


def get_publication_tables(year: int | None = None):
    return get_tables(year=year)


def get_viz_dataset(dataset_name: str):
    dataset_dir = Config.FOLDERS.get("viz", Config.FOLDERS["final"])
    dataset_path = os.path.join(dataset_dir, f"{dataset_name}.json")
    if not os.path.exists(dataset_path):
        return {
            "status": "not_generated",
            "dataset": dataset_name,
            "message": "The visualization dataset has not been generated. The pipeline needs the LFS dataset and table outputs first.",
            "data": [],
        }
    with open(dataset_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def get_excel_report(report_name: str | None = None):
    if report_name is None:
        report_name = "Rwanda_LFS_2020_2025_Master_Report.xlsx"
    candidates = [
        os.path.join(Config.FOLDERS["final"], report_name),
        os.path.join(Config.FOLDERS["final"], "LFS_Macro_Indicators_Report.xlsx"),
        os.path.join(Config.FOLDERS["final"], "Rwanda_LFS_2020_2025_Master_Report.xlsx"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return candidates[0]


def get_validation_status():
    panel = _ensure_pipeline()
    if panel.empty:
        return {
            "status": "not_ready",
            "passed": False,
            "message": "Validation cannot run without official LFS microdata or a confirmed source dataset.",
            "checks": [],
        }

    checks = [
        {
            "name": "Microdata loading",
            "passed": True,
            "note": f"Loaded {len(panel)} records into the Python pipeline.",
        }
    ]
    return {
        "status": "ok",
        "passed": True,
        "message": "Python pipeline is loaded and ready for validation against official LFS tables.",
        "checks": checks,
    }


def process_uploaded_file(filename: str, records: list[dict]):
    if not records:
        raise ValueError("No records were supplied for processing.")

    columns = sorted({key for row in records for key in row.keys()})
    valid_sample = [{k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in row.items()} for row in records[:5]]

    return {
        "status": "accepted",
        "filename": filename,
        "row_count": len(records),
        "column_count": len(columns),
        "columns": columns,
        "sample_rows": valid_sample,
        "message": "Uploaded file was accepted structurally. Real LFS validation still requires the official metadata and survey-weight rules.",
    }


def get_excel_report_path(report_name: str | None = None):
    return get_excel_report(report_name)