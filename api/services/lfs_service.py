import os
import sys
import json
import logging
import pandas as pd
from datetime import datetime
from collections import deque

# Ensure the project root is on the Python path for labour_analytics imports
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from labour_analytics.config import Config
from labour_analytics.ingestion import load_all_waves
from labour_analytics.harmonizer import build_master_panel, resolve_column
from labour_analytics.indicators import compute_all_indicators
from labour_analytics.analysis import (
    compute_ch2_wap_distribution,
    compute_ch2_age_profiles,
    compute_ch3_macro_trends,
    compute_ch4_employment_status,
    compute_ch5_youth_metrics,
    compute_ch6_olf_characteristics,
    compute_ch7_informality_profiles,
)
from labour_analytics.publisher import ExcelPublisher
from labour_analytics.validation import ValidationEngine

logger = logging.getLogger(__name__)
_pipeline_cache = None
_pipeline_logs = deque(maxlen=200)


def _log(message: str):
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] {message}"
    _pipeline_logs.append(entry)
    logger.info(message)


def _ensure_pipeline():
    global _pipeline_cache
    if _pipeline_cache is None:
        _log("Pipeline: starting build_master_panel")
        _pipeline_cache = build_master_panel()
        _log(f"Pipeline: master_panel built with {len(_pipeline_cache)} records")
        _log("Pipeline: starting compute_all_indicators")
        _pipeline_cache = compute_all_indicators(_pipeline_cache)
        _log("Pipeline: indicators computed")
    return _pipeline_cache