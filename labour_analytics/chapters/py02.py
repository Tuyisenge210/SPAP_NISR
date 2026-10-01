"""Chapter 2 tables: labour-force indicators by sex."""

from labour_analytics.chapters.common import weighted_labour_indicators

CHAPTER_NUMBER = 2
CHAPTER_TITLE = "Labour-force indicators by sex"
TABLE_SPECS = (
    ("main_table_2", "Table 2: Labour-force indicators by sex", ("A01", "survey_year", "lf_status", "weight"), "Weighted labour-market indicators for male and female working-age populations."),
)


def produce(panel):
    # CHAPTER 2 — Table 2: national labour-market levels and rates by sex.
    return {"main_table_2": weighted_labour_indicators(panel, ("A01",))}