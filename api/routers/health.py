from fastapi import APIRouter
import os
import pandas as pd
from labour_analytics.config import Config

router = APIRouter()

@router.get("/health")
async def health_check():
    final_dir = Config.FOLDERS.get("final", "")
    parquet_path = os.path.join(final_dir, "RLFS_Harmonized_2020_2025.parquet")
    try:
        pd.read_parquet(parquet_path, columns=["survey_year", "weight", "wap16", "lf_status"])
        parquet_ready = True
    except Exception:
        parquet_ready = False
    return {
        "status": "ok",
        "parquet_ready": parquet_ready,
        "final_dir": final_dir,
    }
