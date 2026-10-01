from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from .chapters import CHAPTER_MODULES, chapter_table_catalogue
from .table_engine import table_catalogue_payload

ROOT = Path(__file__).resolve().parent.parent
RAW_ROOT = ROOT / "raw"
DATA_ROOT = ROOT / "data"
FINAL_ROOT = ROOT / "final"

SOURCE_INVENTORY: List[Dict[str, Any]] = [
    {
        "year": 2020,
        "file": "raw/RW_LFS2020.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2020.",
    },
    {
        "year": 2021,
        "file": "raw/RW_LFS2021.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2021.",
    },
    {
        "year": 2022,
        "file": "raw/RW_LFS2022.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2022.",
    },
    {
        "year": 2023,
        "file": "raw/RW_LFS2023.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2023.",
    },
    {
        "year": 2024,
        "file": "raw/RW_LFS2024.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2024.",
    },
    {
        "year": 2025,
        "file": "raw/RW_LFS2025.dta",
        "kind": "microdata",
        "status": "available",
        "notes": "Official raw LFS microdata for 2025.",
    },
    {
        "year": 2020,
        "file": "data/Data_2020_pup2.dta",
        "kind": "auxiliary-data",
        "status": "available",
        "notes": "Supplementary 2020 dataset retained for harmonisation checks.",
    },
    {
        "year": 2021,
        "file": "data/Labour force survey_2021_dataset_.dta",
        "kind": "auxiliary-data",
        "status": "available",
        "notes": "Supplementary 2021 dataset retained for harmonisation checks.",
    },
    {
        "year": 2022,
        "file": "data/RW_LFS2022.dta",
        "kind": "auxiliary-data",
        "status": "available",
        "notes": "Supplementary 2022 dataset retained for harmonisation checks.",
    },
    {
        "year": 2024,
        "file": "data/RW_LFS2024.dta",
        "kind": "auxiliary-data",
        "status": "available",
        "notes": "Supplementary 2024 dataset retained for harmonisation checks.",
    },
    {
        "file": "final/Rwanda_LFS_2020_2025_Master_Report.xlsx",
        "kind": "publication-report",
        "status": "available",
        "notes": "Master report workbook that anchors the official chapter structure.",
    },
    {
        "file": "final/LFS_Macro_Indicators_Report.xlsx",
        "kind": "macro-report",
        "status": "available",
        "notes": "Macro indicators workbook covering headline labour market measures.",
    },
    {
        "file": "final/Rwanda_LFS_Main_Tables_2020_2025.xlsx",
        "kind": "chapter-table-workbook",
        "status": "generated-on-run",
        "notes": "Chapter-ordered Table 1 through Table 25 outputs, including numbered sub-tables.",
    },
    {
        "file": "final/RLFS_Harmonized_2020_2025.parquet",
        "kind": "harmonized-panel",
        "status": "available",
        "notes": "Harmonized analytic panel output for cross-year analysis.",
    },
]

CHAPTER_CATALOGUE: List[Dict[str, Any]] = [
    {
        "chapter": f"Chapter {chapter.CHAPTER_NUMBER}",
        "title": chapter.CHAPTER_TITLE,
        "status": "implemented",
        "scope": "Tables in the provided Rwanda LFS main-table order, calculated from weighted harmonized microdata.",
        "production_target": ", ".join(spec[0] for spec in chapter.TABLE_SPECS),
    }
    for chapter in CHAPTER_MODULES
]

OUTPUT_COVERAGE: List[Dict[str, Any]] = [
    {
        "output_id": "table_2_1",
        "name": "Working-age population by area and sex",
        "chapter": "Chapter 2",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_2_2",
        "name": "Working-age population by age cohort",
        "chapter": "Chapter 2",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_3_1",
        "name": "Labour force participation and unemployment indicators",
        "chapter": "Chapter 3",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_4_1",
        "name": "Employment status by survey year",
        "chapter": "Chapter 4",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_5_1",
        "name": "Youth labour market indicators",
        "chapter": "Chapter 5",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_6_1",
        "name": "OLF composition by category",
        "chapter": "Chapter 6",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "table_7_1",
        "name": "Formal vs informal employment share",
        "chapter": "Chapter 7",
        "source": "raw/*.dta",
        "status": "ready",
    },
    {
        "output_id": "report_master_workbook",
        "name": "Master publication workbook",
        "chapter": "All chapters",
        "source": "final/Rwanda_LFS_2020_2025_Master_Report.xlsx",
        "status": "reference",
    },
]


def catalogue_payload() -> Dict[str, Any]:
    chapter_outputs = [
        {
            "output_id": table["table_id"],
            "name": table["title"],
            "chapter": table["chapter"],
            "source": "raw/*.dta",
            "status": "implemented",
        }
        for table in chapter_table_catalogue()
    ]
    workbook_output = {
        "output_id": "report_main_tables_workbook",
        "name": "Chapter-ordered LFS main tables workbook",
        "chapter": "Chapters 1-11",
        "source": "final/Rwanda_LFS_Main_Tables_2020_2025.xlsx",
        "status": "generated-on-run",
    }
    return {
        "project": "SPAP_NISR",
        "survey": "Rwanda Labour Force Survey",
        "years": [2020, 2021, 2022, 2023, 2024, 2025],
        "source_inventory": SOURCE_INVENTORY,
        "chapter_catalogue": CHAPTER_CATALOGUE,
        "output_coverage": OUTPUT_COVERAGE + chapter_outputs + [workbook_output],
        "table_catalogue": table_catalogue_payload(),
    }


def write_catalogue(output_dir: Path | str = FINAL_ROOT) -> Path:
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    payload = catalogue_payload()
    source_path = target_dir / "lfs_production_catalogue.json"
    source_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    matrix = {
        "project": payload["project"],
        "coverage": [
            {
                "chapter": item["chapter"],
                "title": item["title"],
                "status": item["status"],
                "target": item["production_target"],
            }
            for item in CHAPTER_CATALOGUE
        ],
    }
    matrix_path = target_dir / "lfs_coverage_matrix.json"
    matrix_path.write_text(json.dumps(matrix, indent=2), encoding="utf-8")
    return source_path


if __name__ == "__main__":
    path = write_catalogue()
    print(path)
