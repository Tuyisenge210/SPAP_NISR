from __future__ import annotations

import numpy as np
import pandas as pd


def resolve_weight(panel: pd.DataFrame) -> str:
    for column in ("weight", "weight2", "Weight"):
        if column in panel.columns:
            return column
    raise ValueError("Chapter tables require a survey weight column.")


def require_columns(panel: pd.DataFrame, columns: tuple[str, ...]) -> None:
    missing = [column for column in columns if column not in panel.columns]
    if missing:
        raise ValueError(f"Chapter table source columns missing: {', '.join(missing)}")


def display_value(column: str, value) -> str:
    if pd.isna(value):
        return "Missing"
    mappings = {"A01": {1: "Male", 2: "Female"}, "urban_rural": {1: "Urban", 2: "Rural"}}
    if column in mappings:
        try:
            return mappings[column].get(int(value), str(value))
        except (TypeError, ValueError):
            return str(value)
    return str(value)


def weighted_labour_indicators(
    panel: pd.DataFrame,
    dimensions: tuple[str, ...] = (),
) -> pd.DataFrame:
    require_columns(panel, ("survey_year", "lf_status"))
    weight = resolve_weight(panel)
    wap_column = "wap16" if "wap16" in panel.columns else None
    if wap_column is None:
        require_columns(panel, ("age",))

    group_columns = [*dimensions, "survey_year"]
    require_columns(panel, tuple(group_columns))
    records = []
    for group_key, group in panel.groupby(group_columns, dropna=False, observed=True, sort=True):
        if not isinstance(group_key, tuple):
            group_key = (group_key,)
        values = dict(zip(group_columns, group_key))
        wap = group[wap_column] == 1 if wap_column else group["age"] >= 16
        in_wap = group.loc[wap]
        employed = in_wap.loc[in_wap["lf_status"] == 1, weight].sum()
        unemployed = in_wap.loc[in_wap["lf_status"] == 2, weight].sum()
        wap_total = in_wap[weight].sum()
        labour_force = employed + unemployed
        records.append(
            {
                **{key: display_value(key, value) for key, value in values.items() if key != "survey_year"},
                "Survey year": int(values["survey_year"]),
                "Working-age population": float(wap_total),
                "Labour force": float(labour_force),
                "Employed": float(employed),
                "Unemployed": float(unemployed),
                "Outside labour force": float(max(wap_total - labour_force, 0)),
                "LFPR (%)": float(100 * labour_force / wap_total) if wap_total else np.nan,
                "Employment-to-population ratio (%)": float(100 * employed / wap_total) if wap_total else np.nan,
                "Unemployment rate (%)": float(100 * unemployed / labour_force) if labour_force else np.nan,
            }
        )
    return pd.DataFrame(records)


def weighted_distribution(
    panel: pd.DataFrame,
    category: str,
    dimensions: tuple[str, ...] = (),
    *,
    employed_only: bool = False,
    working_age_only: bool = False,
    percent: bool = False,
    value_name: str = "Weighted population",
) -> pd.DataFrame:
    require_columns(panel, (category, "survey_year", "lf_status"))
    weight = resolve_weight(panel)
    frame = panel.copy()
    if employed_only:
        frame = frame.loc[frame["lf_status"] == 1]
    elif working_age_only:
        if "wap16" in frame.columns:
            frame = frame.loc[frame["wap16"] == 1]
        elif "age" in frame.columns:
            frame = frame.loc[frame["age"] >= 16]
        else:
            raise ValueError("Working-age distribution requires wap16 or age.")

    group_columns = [*dimensions, "survey_year", category]
    require_columns(frame, tuple(group_columns))
    grouped = frame.groupby(group_columns, dropna=False, observed=True)[weight].sum().rename(value_name).reset_index()
    if percent:
        denominator_columns = [*dimensions, "survey_year"]
        denominators = grouped.groupby(denominator_columns, dropna=False, observed=True)[value_name].transform("sum")
        grouped[value_name] = np.where(denominators > 0, grouped[value_name] / denominators * 100, np.nan)

    grouped = grouped.rename(columns={category: "Category", "survey_year": "Survey year"})
    for column in [*dimensions, "Category"]:
        grouped[column] = grouped[column].map(lambda value: display_value(column, value))
    return grouped