"""Statistical metadata for SPAP.

This module is the single source of truth for:

* the variable registry (what each microdata column means),
* the indicator definitions (numerator / denominator / population / formula),
* the production catalogue (which tables belong to which LFS report chapter).

The traceability chain required by the platform is only possible because every
table entry points at indicator codes, and every indicator code points at the
Python function that computes it:

    Table -> Indicator -> Definition -> Population -> Variables
          -> Derived variables -> Weight -> Formula -> Python function -> Result
"""

from __future__ import annotations

WORKING_AGE_MIN = 16
YOUTH_MAX = 30
SURVEY = "Rwanda Labour Force Survey (LFS)"

# --------------------------------------------------------------------------
# Variable registry
# --------------------------------------------------------------------------

VARIABLES: dict[str, dict] = {
    "person_id": {"label": "Person identifier", "type": "identifier"},
    "year": {"label": "Survey year", "type": "integer"},
    "quarter": {"label": "Survey quarter", "type": "categorical"},
    "province": {"label": "Province", "type": "categorical"},
    "district": {"label": "District", "type": "categorical"},
    "residence": {"label": "Residence", "type": "categorical", "values": ["Urban", "Rural"]},
    "sex": {"label": "Sex", "type": "categorical", "values": ["Male", "Female"]},
    "age": {"label": "Age in completed years", "type": "integer"},
    "education": {
        "label": "Highest level of education attained",
        "type": "categorical",
        "values": ["None", "Primary", "Secondary", "TVET", "Tertiary"],
    },
    "ilo_activity": {
        "label": "Labour force status (ILO definition)",
        "type": "categorical",
        "values": ["employed", "unemployed", "outside_lf"],
    },
    "discouraged": {"label": "Discouraged worker (wants work, not seeking)", "type": "boolean"},
    "available_not_seeking": {"label": "Available for work but not seeking", "type": "boolean"},
    "subsistence_agri": {"label": "Subsistence agriculture work", "type": "boolean"},
    "informal": {"label": "Informal employment", "type": "boolean"},
    "status_employment": {"label": "Status in employment", "type": "categorical"},
    "occupation": {"label": "Occupation (ISCO major group)", "type": "categorical"},
    "industry": {"label": "Economic activity (ISIC section)", "type": "categorical"},
    "hours_worked": {"label": "Hours worked in the reference week", "type": "number"},
    "weight": {"label": "Sampling weight", "type": "number"},
}

# --------------------------------------------------------------------------
# Derived variables
# --------------------------------------------------------------------------

DERIVED_VARIABLES: dict[str, dict] = {
    "working_age": {"label": "Working-age person", "rule": f"age >= {WORKING_AGE_MIN}"},
    "in_labour_force": {
        "label": "In the labour force",
        "rule": "ilo_activity in ('employed', 'unemployed')",
    },
    "employed": {"label": "Employed", "rule": "ilo_activity == 'employed'"},
    "unemployed": {"label": "Unemployed", "rule": "ilo_activity == 'unemployed'"},
    "underemployed": {
        "label": "Time-related underemployed",
        "rule": "employed and hours_worked < 40",
    },
    "youth": {"label": "Youth", "rule": f"{WORKING_AGE_MIN} <= age <= {YOUTH_MAX}"},
    "age_group": {
        "label": "Age group",
        "rule": f"bands: {WORKING_AGE_MIN}-24, 25-34, 35-44, 45-54, 55+",
    },
}

# --------------------------------------------------------------------------
# Indicator definitions
# --------------------------------------------------------------------------

INDICATORS: dict[str, dict] = {
    "LFPR": {
        "name": "Labour force participation rate",
        "short": "LFPR",
        "definition": (
            "Proportion of the working-age population that is either employed or unemployed."
        ),
        "numerator": "Weighted persons employed + unemployed",
        "denominator": "Weighted population aged 16 years and above",
        "population": f"Population aged {WORKING_AGE_MIN}+",
        "variables": ["ilo_activity", "age", "weight"],
        "derived": ["working_age", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "LFPR = 100 x SUM(w * in_labour_force) / SUM(w), "
            f"for persons with age >= {WORKING_AGE_MIN}"
        ),
        "function": "engine.indicators.labour_force_participation_rate",
        "unit": "percent",
    },
    "EPR": {
        "name": "Employment-to-population ratio",
        "short": "EPR",
        "definition": (
            "Proportion of the working-age population that is employed."
        ),
        "numerator": "Weighted persons employed",
        "denominator": "Weighted population aged 16 years and above",
        "population": f"Population aged {WORKING_AGE_MIN}+",
        "variables": ["ilo_activity", "age", "weight"],
        "derived": ["working_age", "employed"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "EPR = 100 x SUM(w * employed) / SUM(w), "
            f"for persons with age >= {WORKING_AGE_MIN}"
        ),
        "function": "engine.indicators.employment_to_population_ratio",
        "unit": "percent",
    },
    "UR1": {
        "name": "Unemployment rate (LU1, strict)",
        "short": "UR1",
        "definition": (
            "Share of the labour force that is without work, available and actively "
            "seeking work (strict ILO measure)."
        ),
        "numerator": "Weighted persons unemployed",
        "denominator": "Weighted labour force (employed + unemployed)",
        "population": "Labour force",
        "variables": ["ilo_activity", "weight"],
        "derived": ["employed", "unemployed", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": "UR1 = 100 x SUM(w * unemployed) / SUM(w * in_labour_force)",
        "function": "engine.indicators.unemployment_rate_lu1",
        "unit": "percent",
    },
    "LU2": {
        "name": "Unemployment rate including discouraged workers (LU2)",
        "short": "LU2",
        "definition": (
            "Relaxed unemployment measure that adds discouraged workers (want work, "
            "not seeking) to both the numerator and the labour force."
        ),
        "numerator": "Weighted (unemployed + discouraged)",
        "denominator": "Weighted (labour force + discouraged)",
        "population": "Labour force plus discouraged workers",
        "variables": ["ilo_activity", "discouraged", "weight"],
        "derived": ["unemployed", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "LU2 = 100 x SUM(w * (unemployed + discouraged)) / "
            "SUM(w * (in_labour_force + discouraged))"
        ),
        "function": "engine.indicators.unemployment_rate_lu2",
        "unit": "percent",
    },
    "LU3": {
        "name": "Unemployment rate including discouraged and available non-seekers (LU3)",
        "short": "LU3",
        "definition": (
            "Further relaxed measure that also counts persons available for work but "
            "not seeking and not classified as discouraged."
        ),
        "numerator": "Weighted (unemployed + discouraged + available not seeking)",
        "denominator": "Weighted (labour force + discouraged + available not seeking)",
        "population": "Labour force plus discouraged and available non-seekers",
        "variables": ["ilo_activity", "discouraged", "available_not_seeking", "weight"],
        "derived": ["unemployed", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "LU3 = 100 x SUM(w * (unemployed + discouraged + available_not_seeking)) / "
            "SUM(w * (in_labour_force + discouraged + available_not_seeking))"
        ),
        "function": "engine.indicators.unemployment_rate_lu3",
        "unit": "percent",
    },
    "LUUR": {
        "name": "Labour underutilisation rate",
        "short": "LUUR",
        "definition": (
            "Composite measure combining unemployment, time-related underemployment, "
            "discouraged workers and available non-seekers."
        ),
        "numerator": "Weighted (unemployed + underemployed + discouraged + available)",
        "denominator": "Weighted (labour force + discouraged + available)",
        "population": "Labour force plus discouraged and available non-seekers",
        "variables": [
            "ilo_activity",
            "hours_worked",
            "discouraged",
            "available_not_seeking",
            "weight",
        ],
        "derived": ["unemployed", "underemployed", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "LUUR = 100 x SUM(w * (unemployed + underemployed + discouraged + available)) / "
            "SUM(w * (in_labour_force + discouraged + available))"
        ),
        "function": "engine.indicators.labour_underutilisation_rate",
        "unit": "percent",
    },
    "INFORMALITY": {
        "name": "Informality rate",
        "short": "Informality",
        "definition": "Share of employed persons whose main job is informal.",
        "numerator": "Weighted employed persons in informal employment",
        "denominator": "Weighted employed persons",
        "population": "Employed population",
        "variables": ["informal", "ilo_activity", "weight"],
        "derived": ["employed"],
        "weight": "Sampling weight (`weight`)",
        "formula": "INFORMALITY = 100 x SUM(w * informal) / SUM(w * employed)",
        "function": "engine.indicators.informality_rate",
        "unit": "percent",
    },
    "SUBSIST_SHARE": {
        "name": "Subsistence agriculture share of employment",
        "short": "Subsistence",
        "definition": (
            "Share of employed persons whose main activity is subsistence agriculture."
        ),
        "numerator": "Weighted employed persons in subsistence agriculture",
        "denominator": "Weighted employed persons",
        "population": "Employed population",
        "variables": ["subsistence_agri", "ilo_activity", "weight"],
        "derived": ["employed"],
        "weight": "Sampling weight (`weight`)",
        "formula": (
            "SUBSIST_SHARE = 100 x SUM(w * subsistence_agri) / SUM(w * employed)"
        ),
        "function": "engine.indicators.subsistence_share",
        "unit": "percent",
    },
    "UNDEREMP": {
        "name": "Time-related underemployment rate",
        "short": "Underemp.",
        "definition": (
            "Share of employed persons working fewer than 40 hours in the reference week "
            "who are willing and available to work additional hours."
        ),
        "numerator": "Weighted employed persons working < 40 hours",
        "denominator": "Weighted employed persons",
        "population": "Employed population",
        "variables": ["hours_worked", "ilo_activity", "weight"],
        "derived": ["employed", "underemployed"],
        "weight": "Sampling weight (`weight`)",
        "formula": "UNDEREMP = 100 x SUM(w * underemployed) / SUM(w * employed)",
        "function": "engine.indicators.time_related_underemployment_rate",
        "unit": "percent",
    },
    "YOUTH_UR": {
        "name": "Youth unemployment rate",
        "short": "Youth UR",
        "definition": (
            f"Unemployment rate restricted to youth aged {WORKING_AGE_MIN}-{YOUTH_MAX}."
        ),
        "numerator": "Weighted unemployed youth",
        "denominator": "Weighted youth labour force",
        "population": f"Youth aged {WORKING_AGE_MIN}-{YOUTH_MAX}",
        "variables": ["ilo_activity", "age", "weight"],
        "derived": ["youth", "unemployed", "in_labour_force"],
        "weight": "Sampling weight (`weight`)",
        "formula": "YOUTH_UR = 100 x SUM(w * unemployed | youth) / SUM(w * in_labour_force | youth)",
        "function": "engine.indicators.youth_unemployment_rate",
        "unit": "percent",
    },
}

# Indicators shown on the production dashboard, in display order.
HEADLINE_INDICATORS = ["LFPR", "EPR", "UR1", "LUUR"]

# --------------------------------------------------------------------------
# Production catalogue (LFS report chapters and their tables)
# --------------------------------------------------------------------------

TABLE_CATALOGUE: list[dict] = [
    {
        "id": "1",
        "chapter": 1,
        "title": "National labour market summary",
        "builder": "national_summary",
        "indicators": ["LFPR", "EPR", "UR1", "LU2", "LU3", "LUUR"],
        "implemented": True,
        "notes": "All persons aged 16 and above. Weighted estimates.",
    },
    {
        "id": "2",
        "chapter": 2,
        "title": "Labour force indicators by sex",
        "builder": "by_sex",
        "indicators": ["LFPR", "EPR", "UR1", "LU2", "LU3", "LUUR"],
        "implemented": True,
    },
    {
        "id": "3.1",
        "chapter": 3,
        "title": "Labour force indicators, urban areas, by sex",
        "builder": "by_sex",
        "filters": {"residence": "Urban"},
        "indicators": ["LFPR", "EPR", "UR1", "LUUR"],
        "implemented": True,
    },
    {
        "id": "3.2",
        "chapter": 3,
        "title": "Labour force indicators, rural areas, by sex",
        "builder": "by_sex",
        "filters": {"residence": "Rural"},
        "indicators": ["LFPR", "EPR", "UR1", "LUUR"],
        "implemented": True,
    },
    {
        "id": "4.1",
        "chapter": 4,
        "title": "Youth and adult labour market indicators",
        "builder": "by_youth",
        "indicators": ["LFPR", "EPR", "UR1", "LUUR"],
        "implemented": True,
    },
    {
        "id": "4.2",
        "chapter": 4,
        "title": "Youth indicators by sex",
        "builder": "by_youth_sex",
        "indicators": ["LFPR", "EPR", "UR1"],
        "implemented": True,
    },
    {
        "id": "4.3",
        "chapter": 4,
        "title": "Youth labour underutilisation",
        "builder": None,
        "indicators": ["LU2", "LU3", "LUUR"],
        "implemented": False,
        "notes": "Planned: requires the youth module of the underutilisation series.",
    },
    {
        "id": "5.1",
        "chapter": 5,
        "title": "Indicators by age group",
        "builder": "by_age",
        "indicators": ["LFPR", "EPR", "UR1"],
        "implemented": True,
    },
    {
        "id": "5.2",
        "chapter": 5,
        "title": "Indicators by age group and sex",
        "builder": "by_age_sex",
        "indicators": ["LFPR", "EPR", "UR1"],
        "implemented": True,
    },
    {
        "id": "6.1",
        "chapter": 6,
        "title": "Indicators by educational attainment and sex",
        "builder": "by_education_sex",
        "indicators": ["LFPR", "UR1"],
        "implemented": True,
    },
    {
        "id": "6.2",
        "chapter": 6,
        "title": "Employment by educational attainment",
        "builder": None,
        "indicators": [],
        "implemented": False,
    },
    {
        "id": "7.1",
        "chapter": 7,
        "title": "Subsistence agriculture participation by sex",
        "builder": "subsistence",
        "indicators": ["SUBSIST_SHARE"],
        "implemented": True,
    },
    {
        "id": "8",
        "chapter": 8,
        "title": "Employed population by economic activity",
        "builder": "share",
        "grouping": "industry",
        "count_indicator": "EPR",
        "implemented": True,
    },
    {
        "id": "9",
        "chapter": 9,
        "title": "Employed population by occupation",
        "builder": "share",
        "grouping": "occupation",
        "count_indicator": "EPR",
        "implemented": True,
    },
    {
        "id": "12",
        "chapter": 10,
        "title": "Employed population by status in employment",
        "builder": "share",
        "grouping": "status_employment",
        "count_indicator": "EPR",
        "implemented": True,
    },
    {
        "id": "14",
        "chapter": 10,
        "title": "Informal employment",
        "builder": "by_sex",
        "indicators": ["INFORMALITY", "UNDEREMP"],
        "implemented": True,
    },
    {
        "id": "21",
        "chapter": 11,
        "title": "District labour market indicators",
        "builder": "by_district",
        "indicators": ["LFPR", "EPR", "UR1"],
        "implemented": True,
    },
]

# Tables that appear in the NISR LFS workbook but are not yet wired to a producer.
PLANNED_TABLES: list[dict] = [
    {"id": "10", "chapter": 9, "title": "Employment by occupation and sex"},
    {"id": "11", "chapter": 9, "title": "Employment by occupation and residence"},
    {"id": "13", "chapter": 10, "title": "Employment status by sex"},
    {"id": "15", "chapter": 10, "title": "Informal employment by economic activity"},
    {"id": "16", "chapter": 10, "title": "Child labour indicators"},
    {"id": "17", "chapter": 10, "title": "Working hours distribution"},
    {"id": "18", "chapter": 10, "title": "Multiple job holding"},
    {"id": "19", "chapter": 10, "title": "Union and contract coverage"},
    {"id": "20", "chapter": 10, "title": "Agricultural employment detail"},
    {"id": "22", "chapter": 11, "title": "District unemployment detail"},
    {"id": "23", "chapter": 11, "title": "District youth indicators"},
    {"id": "24", "chapter": 11, "title": "District informality"},
    {"id": "25", "chapter": 11, "title": "District subsistence agriculture"},
]

for _planned in PLANNED_TABLES:
    TABLE_CATALOGUE.append(
        {
            "id": _planned["id"],
            "chapter": _planned["chapter"],
            "title": _planned["title"],
            "builder": None,
            "indicators": [],
            "implemented": False,
            "notes": "Planned: specification registered, producer not yet implemented.",
        }
    )

CHAPTERS = [
    {"id": 1, "title": "Labour market overview", "short": "Overview"},
    {"id": 2, "title": "Labour force participation", "short": "Participation"},
    {"id": 3, "title": "Urban and rural labour markets", "short": "Urban / rural"},
    {"id": 4, "chapter": 4, "title": "Youth and the labour market", "short": "Youth"},
    {"id": 5, "title": "Age and the labour market", "short": "Age"},
    {"id": 6, "title": "Education and the labour market", "short": "Education"},
    {"id": 7, "title": "Subsistence agriculture", "short": "Subsistence"},
    {"id": 8, "title": "Employment by economic activity", "short": "Activity"},
    {"id": 9, "title": "Employment by occupation", "short": "Occupation"},
    {"id": 10, "title": "Employment conditions", "short": "Conditions"},
    {"id": 11, "title": "District-level indicators", "short": "Districts"},
]

AGE_BANDS = [
    (WORKING_AGE_MIN, 24, "16-24"),
    (25, 34, "25-34"),
    (35, 44, "35-44"),
    (45, 54, "45-54"),
    (55, 200, "55+"),
]

EDUCATION_LEVELS = ["None", "Primary", "Secondary", "TVET", "Tertiary"]


def table_by_id(table_id: str) -> dict | None:
    return next((t for t in TABLE_CATALOGUE if t["id"] == table_id), None)


def catalogue_payload() -> dict:
    """Serialisable catalogue used by the frontend."""
    chapters = []
    for chapter in CHAPTERS:
        tables = [t for t in TABLE_CATALOGUE if t["chapter"] == chapter["id"]]
        chapters.append(
            {
                **chapter,
                "tables": tables,
                "implemented": sum(1 for t in tables if t["implemented"]),
                "total": len(tables),
            }
        )
    return {
        "survey": SURVEY,
        "working_age_min": WORKING_AGE_MIN,
        "youth_max": YOUTH_MAX,
        "variables": VARIABLES,
        "derived": DERIVED_VARIABLES,
        "indicators": INDICATORS,
        "chapters": chapters,
        "tables": TABLE_CATALOGUE,
        "implemented_tables": sum(1 for t in TABLE_CATALOGUE if t["implemented"]),
        "total_tables": len(TABLE_CATALOGUE),
    }
