"""Chapter 4 tables: adult and youth labour-market indicators."""

import numpy as np

from labour_analytics.chapters.common import weighted_labour_indicators

CHAPTER_NUMBER = 4
CHAPTER_TITLE = "Youth and adult labour-force indicators"
TABLE_SPECS = (
    ("main_table_4_1", "Table 4.1: Labour-force indicators among youth and adults", ("age", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for ages 16-30 and 31+."),
    ("main_table_4_2", "Table 4.2: Youth labour-force indicators by sex", ("age", "A01", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for ages 16-30 by sex."),
    ("main_table_4_3", "Table 4.3: Youth labour-force indicators by area of residence", ("age", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for ages 16-30 by residence."),
)


def produce(panel):
    # CHAPTER 4 — Table 4.1: youth (16-30) compared with adults (31+).
    age = panel["age"]
    age_groups = panel.loc[(age >= 16)].copy()
    age_groups["Age group"] = np.where(age_groups["age"] <= 30, "Youth (16-30)", "Adults (31+)")

    # CHAPTER 4 — Tables 4.2-4.3: youth indicators split by sex and residence.
    youth = age_groups.loc[age_groups["age"] <= 30]
    return {
        "main_table_4_1": weighted_labour_indicators(age_groups, ("Age group",)),
        "main_table_4_2": weighted_labour_indicators(youth, ("A01",)),
        "main_table_4_3": weighted_labour_indicators(youth, ("urban_rural",)),
    }