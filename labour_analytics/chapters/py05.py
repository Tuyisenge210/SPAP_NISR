"""Chapter 5 tables: labour-force indicators by age group."""

import pandas as pd

from labour_analytics.chapters.common import weighted_labour_indicators

CHAPTER_NUMBER = 5
CHAPTER_TITLE = "Labour-force indicators by age group"
TABLE_SPECS = (
    ("main_table_5_1", "Table 5.1: Male labour-force indicators by age group", ("age", "A01", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for male five-year-report age cohorts."),
    ("main_table_5_2", "Table 5.2: Female labour-force indicators by age group", ("age", "A01", "survey_year", "lf_status", "weight"), "Weighted age-group indicators for women."),
    ("main_table_5_3", "Table 5.3: Urban labour-force indicators by age group", ("age", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted age-group indicators for urban residents."),
    ("main_table_5_4", "Table 5.4: Rural labour-force indicators by age group", ("age", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted age-group indicators for rural residents."),
)


def _with_age_group(panel):
    frame = panel.loc[panel["age"] >= 16].copy()
    frame["Age group"] = pd.cut(
        frame["age"],
        bins=[16, 25, 35, 45, 55, float("inf")],
        labels=["16-24", "25-34", "35-44", "45-54", "55+"],
        right=False,
    )
    return frame


def produce(panel):
    # CHAPTER 5 — Tables 5.1-5.4: male, female, urban, and rural age profiles.
    age_data = _with_age_group(panel)
    male = age_data.loc[age_data["A01"] == 1]
    female = age_data.loc[age_data["A01"] == 2]
    urban = age_data.loc[age_data["urban_rural"] == 1]
    rural = age_data.loc[age_data["urban_rural"] == 2]
    return {
        "main_table_5_1": weighted_labour_indicators(male, ("Age group",)),
        "main_table_5_2": weighted_labour_indicators(female, ("Age group",)),
        "main_table_5_3": weighted_labour_indicators(urban, ("Age group",)),
        "main_table_5_4": weighted_labour_indicators(rural, ("Age group",)),
    }