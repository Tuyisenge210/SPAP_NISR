"""Chapter 8 tables: employed population by economic activity."""

from labour_analytics.chapters.common import require_columns, weighted_distribution

CHAPTER_NUMBER = 8
CHAPTER_TITLE = "Employment by economic activity"
TABLE_SPECS = (
    ("main_table_8", "Table 8: Employed population by economic activity and sex", ("isic2digitdigit", "A01", "survey_year", "lf_status", "weight"), "Weighted employed-population distribution by economic-activity code and sex."),
    ("main_table_9", "Table 9: Employed population by economic activity and residence", ("isic2digitdigit", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted employed-population distribution by economic-activity code and residence."),
)


def produce(panel):
    # CHAPTER 8 — Tables 8-9: employment across economic activities.
    activity = next((name for name in ("isic2digitdigit", "main_sect", "D04") if name in panel.columns), None)
    if activity is None:
        require_columns(panel, ("isic2digitdigit",))
    return {
        "main_table_8": weighted_distribution(panel, activity, ("A01",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
        "main_table_9": weighted_distribution(panel, activity, ("urban_rural",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
    }