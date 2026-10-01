"""Chapter 9 tables: employed population by occupation."""

from labour_analytics.chapters.common import require_columns, weighted_distribution

CHAPTER_NUMBER = 9
CHAPTER_TITLE = "Employment by occupation"
TABLE_SPECS = (
    ("main_table_10", "Table 10: Employed population by occupation and sex", ("isco2digit", "A01", "survey_year", "lf_status", "weight"), "Weighted employed-population distribution by occupation code and sex."),
    ("main_table_11", "Table 11: Employed population by occupation and residence", ("isco2digit", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted employed-population distribution by occupation code and residence."),
)


def produce(panel):
    # CHAPTER 9 — Tables 10-11: occupation codes by sex and residence.
    occupation = next((name for name in ("isco2digit", "indd01") if name in panel.columns), None)
    if occupation is None:
        require_columns(panel, ("isco2digit",))
    return {
        "main_table_10": weighted_distribution(panel, occupation, ("A01",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
        "main_table_11": weighted_distribution(panel, occupation, ("urban_rural",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
    }