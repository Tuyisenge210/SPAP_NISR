import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    ROOT_DIR = os.getenv("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    FOLDERS = {
        "raw": os.path.join(ROOT_DIR, "raw"),
        "temp": os.path.join(ROOT_DIR, "temp"),
        "final": os.path.join(ROOT_DIR, "final"),
        "viz": os.path.join(ROOT_DIR, "final", "viz"),
    }
    YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

    RENAME_DICTIONARY = {
        "a01": "A01",
        "A04": "age",
        "a04": "age",
        "Code_UR": "urban_rural",
        "code_ur": "urban_rural",
        "Weight": "weight",
        "PSU_NO": "psu",
        "psu_no": "psu",
        "code_dis": "district",
        "district_code": "district",
    }

    AGE_BINS = [16, 25, 35, 55, 100]
    AGE_LABELS = ["16-24", "25-34", "35-54", "55+"]

    AGE_5_BINS = [16, 25, 35, 45, 55, 100]
    AGE_5_LABELS = ["16-24", "25-34", "35-44", "45-54", "55+"]

    FINAL_PARQUET = os.path.join(FOLDERS["final"], "RLFS_Harmonized_2020_2025.parquet")
    EXCEL_REPORT = os.path.join(FOLDERS["final"], "Rwanda_LFS_2020_2025_Master_Report.xlsx")

    @classmethod
    def ensure_folders(cls):
        for folder in cls.FOLDERS.values():
            os.makedirs(folder, exist_ok=True)