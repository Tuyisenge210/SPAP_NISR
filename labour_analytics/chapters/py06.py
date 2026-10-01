"""Chapter 6 tables: labour-force indicators by educational attainment."""

from labour_analytics.chapters.common import require_columns, weighted_labour_indicators

CHAPTER_NUMBER = 6
CHAPTER_TITLE = "Labour-force indicators by educational attainment"
TABLE_SPECS = (
    ("main_table_6_1", "Table 6.1: Male labour-force indicators by education", ("attained", "A01", "survey_year", "lf_status", "weight"), "Weighted indicators by completed education for men."),
    ("main_table_6_2", "Table 6.2: Female labour-force indicators by education", ("attained", "A01", "survey_year", "lf_status", "weight"), "Weighted indicators by completed education for women."),
)


def produce(panel):
    # CHAPTER 6 — Tables 6.1-6.2: education profiles split by sex.
    education = "attained" if "attained" in panel.columns else "B02A"
    require_columns(panel, (education, "A01"))
    male = panel.loc[panel["A01"] == 1]
    female = panel.loc[panel["A01"] == 2]
    return {
        "main_table_6_1": weighted_labour_indicators(male, (education,)),
        "main_table_6_2": weighted_labour_indicators(female, (education,)),
    }