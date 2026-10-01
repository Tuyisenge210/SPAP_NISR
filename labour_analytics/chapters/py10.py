"""Chapter 10 tables: education, employment status, informality, and agriculture."""

from labour_analytics.chapters.common import require_columns, resolve_weight, weighted_distribution

CHAPTER_NUMBER = 10
CHAPTER_TITLE = "Employment characteristics and informality"
AGRICULTURE_YES_CODE = 1
TABLE_SPECS = (
    ("main_table_12", "Table 12: Employed population by education and sex", ("attained", "A01", "survey_year", "lf_status", "weight"), "Weighted education distribution among employed people, by sex."),
    ("main_table_13", "Table 13: Employed population by education", ("attained", "survey_year", "lf_status", "weight"), "Weighted education distribution among employed people."),
    ("main_table_14", "Table 14: Employed population by education and residence", ("attained", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted education distribution among employed people, by residence."),
    ("main_table_15", "Table 15: Employment status by sex", ("D05", "A01", "survey_year", "lf_status", "weight"), "Weighted distribution of recorded D05 status codes among employed people, by sex."),
    ("main_table_16", "Table 16: Employed population by employment status and residence", ("D05", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted distribution of recorded D05 status codes among employed people, by residence."),
    ("main_table_16_1", "Table 16.1: Employment status distribution by sex", ("D05", "A01", "survey_year", "lf_status", "weight"), "Percent distribution of recorded D05 status codes among employed people, by sex."),
    ("main_table_16_2", "Table 16.2: Employment status distribution by residence", ("D05", "urban_rural", "survey_year", "lf_status", "weight"), "Percent distribution of recorded D05 status codes among employed people, by residence."),
    ("main_table_17", "Table 17: Formal and informal employment by sex", ("IEV2", "A01", "survey_year", "lf_status", "weight"), "Weighted distribution of the survey's IEV2 formal/informal employment classification, by sex."),
    ("main_table_18", "Table 18: Formal and informal employment by residence", ("IEV2", "urban_rural", "survey_year", "lf_status", "weight"), "Weighted distribution of IEV2 formal/informal employment classification, by residence."),
    ("main_table_19", "Table 19: Formal and informal employment by education", ("IEV2", "attained", "survey_year", "lf_status", "weight"), "Weighted distribution of IEV2 formal/informal employment classification, by education."),
    ("main_table_20", "Table 20: Agricultural workers as a share of the workforce by status and education", ("C04", "D05", "attained", "survey_year", "lf_status", "weight"), "Weighted number of employed agricultural workers and their percentage of all employed people in the same D05 status, education, and year group. Confirm the C04 yes value label against the official codebook before publication."),
)


def produce(panel):
    # CHAPTER 10 — Tables 12-14: education profile of employed population.
    education = "attained" if "attained" in panel.columns else "B02A"
    require_columns(panel, (education, "A01", "urban_rural", "D05"))
    employed = panel.loc[panel["lf_status"] == 1]
    tables = {
        "main_table_12": weighted_distribution(employed, education, ("A01",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
        "main_table_13": weighted_distribution(employed, education, employed_only=True, percent=True, value_name="Share of employed population (%)"),
        "main_table_14": weighted_distribution(employed, education, ("urban_rural",), employed_only=True, percent=True, value_name="Share of employed population (%)"),
    }

    # CHAPTER 10 — Tables 15-16: recorded employment-status codes.
    tables.update(
        {
            "main_table_15": weighted_distribution(employed, "D05", ("A01",), employed_only=True),
            "main_table_16": weighted_distribution(employed, "D05", ("urban_rural",), employed_only=True),
            "main_table_16_1": weighted_distribution(employed, "D05", ("A01",), employed_only=True, percent=True, value_name="Share (%)"),
            "main_table_16_2": weighted_distribution(employed, "D05", ("urban_rural",), employed_only=True, percent=True, value_name="Share (%)"),
        }
    )

    # CHAPTER 10 — Tables 17-19: use the survey-derived IEV2 classification; do not infer it from earnings.
    require_columns(employed, ("IEV2",))
    tables.update(
        {
            "main_table_17": weighted_distribution(employed, "IEV2", ("A01",), employed_only=True, percent=True, value_name="Share (%)"),
            "main_table_18": weighted_distribution(employed, "IEV2", ("urban_rural",), employed_only=True, percent=True, value_name="Share (%)"),
            "main_table_19": weighted_distribution(employed, "IEV2", (education,), employed_only=True, percent=True, value_name="Share (%)"),
        }
    )

    # CHAPTER 10 — Table 20: compare agriculture workers with the full employed workforce.
    require_columns(employed, ("C04", "D05", education))
    c04_response = employed["C04"]
    agriculture_yes = c04_response.eq(AGRICULTURE_YES_CODE) | c04_response.astype(str).str.strip().str.casefold().isin({"1", "yes"})
    agriculture_workers = employed.loc[agriculture_yes]
    weight = resolve_weight(employed)
    group_columns = ["D05", education, "survey_year"]
    workforce = (
        employed.groupby(group_columns, dropna=False, observed=True)[weight]
        .sum()
        .rename("Employed workforce")
        .reset_index()
    )
    agriculture = (
        agriculture_workers.groupby(group_columns, dropna=False, observed=True)[weight]
        .sum()
        .rename("Agricultural workers")
        .reset_index()
    )
    table_20 = workforce.merge(agriculture, on=group_columns, how="left")
    table_20["Agricultural workers"] = table_20["Agricultural workers"].fillna(0)
    table_20["Share of employed workforce (%)"] = (
        table_20["Agricultural workers"] / table_20["Employed workforce"] * 100
    )
    tables["main_table_20"] = table_20
    return tables