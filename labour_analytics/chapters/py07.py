"""Chapter 7 tables: participation in subsistence agriculture."""

from labour_analytics.chapters.common import require_columns, weighted_distribution

CHAPTER_NUMBER = 7
CHAPTER_TITLE = "Participation in subsistence agriculture"
TABLE_SPECS = (
    ("main_table_7_1", "Table 7.1: Male population participating in subsistence agriculture", ("sub", "A01", "survey_year", "weight"), "Weighted distribution of the survey's subsistence-agriculture classification among men."),
    ("main_table_7_2", "Table 7.2: Female population participating in subsistence agriculture", ("sub", "A01", "survey_year", "weight"), "Weighted distribution of the survey's subsistence-agriculture classification among women."),
)


def produce(panel):
    # CHAPTER 7 — Tables 7.1-7.2: subsistence-agriculture profile by sex.
    category = "sub" if "sub" in panel.columns else "foodstuff"
    require_columns(panel, (category, "A01"))
    male = panel.loc[panel["A01"] == 1]
    female = panel.loc[panel["A01"] == 2]
    return {
        "main_table_7_1": weighted_distribution(male, category, working_age_only=True, percent=True, value_name="Share of working-age population (%)"),
        "main_table_7_2": weighted_distribution(female, category, working_age_only=True, percent=True, value_name="Share of working-age population (%)"),
    }