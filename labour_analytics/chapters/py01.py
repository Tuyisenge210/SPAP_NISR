"""Chapter 1 tables: national summary labour-force indicators."""

from labour_analytics.analysis import compute_ch3_macro_trends
from labour_analytics.chapters.common import weighted_labour_indicators

CHAPTER_NUMBER = 1
CHAPTER_TITLE = "National summary indicators"
TABLE_SPECS = (
    ("main_table_1", "Table 1: Summary labour-force indicators, Rwanda", ("survey_year", "lf_status", "plf_status", "tru", "weight"), "Weighted WAP, LFPR, employment-to-population ratio, UR1, LU2, LU3, and LUUR indicators by year."),
)


def produce(panel):
    # CHAPTER 1 — Table 1: headline rates plus ILO labour-underutilization measures.
    headline = weighted_labour_indicators(panel)
    working_age = panel.loc[panel["wap16"] == 1] if "wap16" in panel.columns else panel.loc[panel["age"] >= 16]
    underutilization = compute_ch3_macro_trends(working_age).rename(
        columns={"Survey Year": "Survey year"}
    )
    underutilization = underutilization.drop(
        columns=["WAP Volume", "LFPR (%)"], errors="ignore"
    )
    summary = headline.merge(underutilization, on="Survey year", how="left")
    return {"main_table_1": summary}