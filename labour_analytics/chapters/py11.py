"""Chapter 11 tables: district labour-market indicators by observed province code."""

CHAPTER_NUMBER = 11
CHAPTER_TITLE = "Labour-force indicators by district"
TABLE_SPECS = tuple(
    (
        f"main_table_{number}",
        f"Table {number}: District labour-force indicators (province code in source data)",
        ("province", "district", "survey_year", "lf_status", "weight"),
        "Weighted labour-market indicators by district for one observed province code; codes are retained because value labels are not available in the harmonized panel.",
    )
    for number in range(21, 26)
)


def produce(panel):
    # CHAPTER 11 — Tables 21-25: one district table for each observed province code.
    province_column = "province" if "province" in panel.columns else "province_code"
    if province_column not in panel.columns or "district" not in panel.columns:
        raise ValueError("Chapter 11 requires province and district codes in the harmonized panel.")

    province_codes = sorted(panel[province_column].dropna().unique().tolist())[:5]
    result = {}
    output_columns = [
        "Province code",
        "district",
        "Survey year",
        "Working-age population",
        "Labour force",
        "Employed",
        "Unemployed",
        "LFPR (%)",
        "Employment-to-population ratio (%)",
        "Unemployment rate (%)",
    ]
    for number in range(21, 26):
        if number - 21 >= len(province_codes):
            result[f"main_table_{number}"] = panel.__class__(columns=output_columns)
            continue
        province_code = province_codes[number - 21]
        province_panel = panel.loc[panel[province_column] == province_code]
        weight = next((column for column in ("weight", "weight2", "Weight") if column in province_panel.columns), None)
        if weight is None:
            raise ValueError("Chapter 11 requires a survey weight column.")
        wap_column = "wap16" if "wap16" in province_panel.columns else None
        if wap_column is None and "age" not in province_panel.columns:
            raise ValueError("Chapter 11 requires wap16 or age to identify working-age people.")

        records = []
        for (district, year), group in province_panel.groupby(["district", "survey_year"], dropna=False, observed=True):
            is_wap = group[wap_column] == 1 if wap_column else group["age"] >= 16
            working_age = group.loc[is_wap]
            employed = working_age.loc[working_age["lf_status"] == 1, weight].sum()
            unemployed = working_age.loc[working_age["lf_status"] == 2, weight].sum()
            population = working_age[weight].sum()
            labour_force = employed + unemployed
            records.append(
                {
                    "district": str(district),
                    "Survey year": int(year),
                    "Working-age population": float(population),
                    "Labour force": float(labour_force),
                    "Employed": float(employed),
                    "Unemployed": float(unemployed),
                    "LFPR (%)": 100 * labour_force / population if population else None,
                    "Employment-to-population ratio (%)": 100 * employed / population if population else None,
                    "Unemployment rate (%)": 100 * unemployed / labour_force if labour_force else None,
                }
            )
        table = panel.__class__(records)
        table.insert(0, "Province code", str(province_code))
        result[f"main_table_{number}"] = table
    return result