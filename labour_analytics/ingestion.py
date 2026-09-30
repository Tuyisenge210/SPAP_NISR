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
    missing = []
    for year in years:
        path = os.path.join(raw_folder, f"RW_LFS{year}.dta")
        if os.path.exists(path):
            waves[year] = load_raw_stata(path)
        else:
            missing.append(path)

    if not waves:
        raise FileNotFoundError(
            "No raw LFS microdata files were found in the configured raw folder. "
            "This project requires the official Rwanda LFS .dta files or an equivalent validated source."
        )

    if missing:
        raise FileNotFoundError(
            "Some raw LFS microdata files are missing: " + "; ".join(missing)
        )

    return waves
