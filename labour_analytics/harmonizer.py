import os
import re
import pandas as pd
from .config import Config


def extract_clean_lfs_year(val):
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)) and not pd.isna(val):
        return int(val)
    match = re.search(r"(202[0-6])", str(val))
    if match:
        return int(match.group(1))
    return None


def resolve_column(df: pd.DataFrame, candidates: list):
    for col in candidates:
        if col in df.columns:
            return col
    return None


def harmonize_columns(df: pd.DataFrame, rename_dict: dict) -> pd.DataFrame:
    return df.rename(columns=rename_dict)


def build_master_panel(
    years=None,
    raw_folder=None,
    rename_dict=None,
) -> pd.DataFrame:
    if years is None:
        years = Config.YEARS
    if raw_folder is None:
        raw_folder = Config.FOLDERS["raw"]
    if rename_dict is None:
        rename_dict = Config.RENAME_DICTIONARY

    panel_buffer = []

    for year in years:
        path = os.path.join(raw_folder, f"RW_LFS{year}.dta")
        if not os.path.exists(path):
            continue

        df = pd.read_stata(path, convert_categoricals=False)
        df["survey_year"] = int(year)
        df = harmonize_columns(df, rename_dict)

        temp_path = os.path.join(Config.FOLDERS["temp"], f"harmonized_{year}.dta")
        df.to_stata(temp_path, write_index=False, version=118)

        panel_buffer.append(df)

    if not panel_buffer:
        raise FileNotFoundError("No raw microdata files ingested.")

    master_panel = pd.concat(panel_buffer, axis=0, ignore_index=True, join="outer")

    master_panel["survey_year"] = (
        master_panel["survey_year"].apply(extract_clean_lfs_year)
    )
    master_panel = master_panel[master_panel["survey_year"].notna()]
    master_panel["survey_year"] = master_panel["survey_year"].astype(int)

    if "weight" not in master_panel.columns and "weight2" in master_panel.columns:
        master_panel.rename(columns={"weight2": "weight"}, inplace=True)
    elif "weight" in master_panel.columns and "weight2" in master_panel.columns:
        master_panel["weight"] = master_panel["weight"].fillna(master_panel["weight2"])

    return master_panel
