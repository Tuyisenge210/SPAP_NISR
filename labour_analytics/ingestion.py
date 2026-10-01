import os
import pandas as pd
from .config import Config


def load_raw_stata(file_path: str) -> pd.DataFrame:
    return pd.read_stata(file_path, convert_categoricals=False)


def load_all_waves(
    years=None,
    raw_folder=None,
    convert_categoricals=False,
) -> dict[int, pd.DataFrame]:
    if years is None:
        years = Config.YEARS
    if raw_folder is None:
        raw_folder = Config.FOLDERS["raw"]

    waves = {}
    for year in years:
        path = os.path.join(raw_folder, f"RW_LFS{year}.dta")
        if os.path.exists(path):
            waves[year] = load_raw_stata(path)
        else:
            raise FileNotFoundError(f"Missing raw file: {path}")
    return waves
