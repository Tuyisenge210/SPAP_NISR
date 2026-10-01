"""Chapter 3 tables: labour-market indicators by sex and residence."""

from labour_analytics.chapters.common import weighted_labour_indicators

CHAPTER_NUMBER = 3
CHAPTER_TITLE = "Labour-force indicators by sex and residence"
TABLE_SPECS = (
    ("main_table_3_1", "Table 3.1: Urban labour-force indicators by sex", ("A01", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for men and women in urban areas."),
    ("main_table_3_2", "Table 3.2: Rural labour-force indicators by sex", ("A01", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for men and women in rural areas."),
)


def produce(panel):
    # CHAPTER 3 — Tables 3.1 and 3.2: urban and rural results by sex.
    urban = panel.loc[panel["urban_rural"] == 1]
    rural = panel.loc[panel["urban_rural"] == 2]
    return {
        "main_table_3_1": weighted_labour_indicators(urban, ("A01",)),
        "main_table_3_2": weighted_labour_indicators(rural, ("A01",)),
    }