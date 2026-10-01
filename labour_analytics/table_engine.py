from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .analysis import (
    compute_ch2_age_profiles,
    compute_ch2_wap_distribution,
    compute_ch3_macro_trends,
    compute_ch4_employment_status,
    compute_ch5_youth_metrics,
    compute_ch6_olf_characteristics,
    compute_ch7_informality_profiles,
)
from .chapters import chapter_table_catalogue, produce_chapter_tables


@dataclass(frozen=True)
class TableDefinition:
    table_id: str
    output_key: str
    chapter: str
    title: str
    sheet_name: str
    number_format: str
    source_variables: tuple[str, ...]
    formula: str


@dataclass(frozen=True)
class TableProductionRun:
    tables: dict[str, pd.DataFrame]
    years: tuple[int, ...]
    weight_column: str
    source_records: int

    def as_records(self) -> dict[str, list[dict]]:
        result = {}
        for table_id, frame in self.tables.items():
            output = (
                frame.reset_index()
                if isinstance(frame.index, pd.MultiIndex)
                or not isinstance(frame.index, pd.RangeIndex)
                else frame
            )
            output = output.astype(object).where(pd.notna(output), None)
            result[table_id] = output.to_dict(orient="records")
        return result


LEGACY_TABLE_CATALOGUE = (
    TableDefinition(
        "table_2_1",
        "Table_2.1_WAP_Distribution",
        "Chapter 2",
        "Working-age population distribution by area of residence and gender",
        "Table_2.1_WAP_Distribution",
        "#,##0",
        ("urban_rural", "A01", "survey_year", "weight"),
        "Sum of survey weights by residence, sex, and year among people aged 16+.",
    ),
    TableDefinition(
        "table_2_2",
        "Table_2.2_Age_Profiles",
        "Chapter 2",
        "Weighted age cohort distribution (%)",
        "Table_2.2_Age_Profiles",
        "0.0",
        ("age", "survey_year", "weight"),
        "Weighted population in each age cohort divided by the year's weighted WAP, times 100.",
    ),
    TableDefinition(
        "table_3_1",
        "Table_3.1_ILO_Macro_Trends",
        "Chapter 3",
        "ILO macro trends (WAP volume, LFPR, UR1, LU2, LU3, LUUR)",
        "Table_3.1_ILO_Macro_Trends",
        "0.0",
        ("wap16", "lf_status", "plf_status", "tru", "survey_year", "weight"),
        "Weighted ILO labour-force measures and labour-underutilization rates by year.",
    ),
    TableDefinition(
        "table_4_1",
        "Table_4_Employment_Status",
        "Chapter 4",
        "Employment status in employment (D05)",
        "Ch4_Employment_Status",
        "#,##0",
        ("D05", "survey_year", "weight"),
        "Sum of survey weights by harmonized D05 employment-status category and year.",
    ),
    TableDefinition(
        "table_5_1",
        "Table_5_Youth_Metrics",
        "Chapter 5",
        "Youth unemployment and NEET metrics",
        "Ch5_Youth_NEET_Metrics",
        "#,##0",
        ("age", "lf_status", "E01", "survey_year", "weight"),
        "Youth unemployment is unemployed weight / youth labour-force weight; NEET is NEET youth weight / total youth weight.",
    ),
    TableDefinition(
        "table_6_1",
        "Table_6_OLF_Characteristics",
        "Chapter 6",
        "Characteristics of persons outside the labour force",
        "Ch6_OLF_Characteristics",
        "#,##0",
        ("lf_status", "foodstuff", "survey_year", "weight"),
        "Sum of survey weights by outside-labour-force subcategory and year.",
    ),
    TableDefinition(
        "table_7_1",
        "Table_7_Informality_Profiles",
        "Chapter 7",
        "Informal sector and informal employment (%)",
        "Ch7_Informality_Profiles",
        "0.0",
        ("lf_status", "informal_flag", "D12", "D05", "survey_year", "weight"),
        "Weighted formal and informal employed populations divided by total employed population, times 100.",
    ),
)

CHAPTER_TABLE_CATALOGUE = tuple(
    TableDefinition(
        table["table_id"],
        table["output_key"],
        table["chapter"],
        table["title"],
        table["table_id"][:31],
        "#,##0.0",
        tuple(table["source_variables"]),
        table["formula"],
    )
    for table in chapter_table_catalogue()
)

TABLE_CATALOGUE = LEGACY_TABLE_CATALOGUE + CHAPTER_TABLE_CATALOGUE


def table_catalogue_payload() -> list[dict]:
    legacy_tables = [
        {
            "table_id": table.table_id,
            "output_key": table.output_key,
            "chapter": table.chapter,
            "title": table.title,
            "source_variables": list(table.source_variables),
            "formula": table.formula,
            "output_sheet": table.sheet_name,
        }
        for table in LEGACY_TABLE_CATALOGUE
    ]
    return legacy_tables + chapter_table_catalogue()


def _resolve_weight_column(panel: pd.DataFrame) -> str:
    for column in ("weight", "weight2", "Weight"):
        if column in panel.columns:
            return column
    raise ValueError("Production panel must contain a survey weight column.")


def produce_tables(panel: pd.DataFrame) -> TableProductionRun:
    required = {"survey_year", "wap16", "lf_status"}
    missing = sorted(required.difference(panel.columns))
    if missing:
        raise ValueError(f"Production panel is missing required columns: {', '.join(missing)}")

    weight_column = _resolve_weight_column(panel)
    wap = panel.loc[panel["wap16"] == 1].copy()
    olf = wap.loc[wap["lf_status"] == 3].copy()
    employed = wap.loc[wap["lf_status"] == 1].copy()

    frames = {
        "table_2_1": compute_ch2_wap_distribution(wap, weight_column),
        "table_2_2": compute_ch2_age_profiles(wap, weight_column),
        "table_3_1": compute_ch3_macro_trends(wap),
        "table_4_1": compute_ch4_employment_status(wap, weight_column),
        "table_5_1": compute_ch5_youth_metrics(wap, weight_column),
        "table_6_1": compute_ch6_olf_characteristics(olf, weight_column),
        "table_7_1": compute_ch7_informality_profiles(employed, weight_column),
    }
    frames.update(produce_chapter_tables(panel))
    years = tuple(sorted(panel["survey_year"].dropna().astype(int).unique()))
    return TableProductionRun(frames, years, weight_column, len(panel))