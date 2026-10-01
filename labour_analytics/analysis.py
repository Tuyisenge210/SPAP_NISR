import numpy as np
import pandas as pd
from .harmonizer import resolve_column, extract_clean_lfs_year
from .publisher import ExcelPublisher


def _resolve_analysis_columns(master_panel):
    gender_col = resolve_column(master_panel, ["A01", "a01"])
    weight_col = resolve_column(master_panel, ["weight", "Weight", "weight2"])
    return gender_col, weight_col


_CH4_STATUS_INDEX = [
    "Employee",
    "Employer",
    "Own Account Worker",
    "Cooperative Member",
    "Contributing Family Worker",
]


def compute_ch2_wap_distribution(wap_data, weight_col):
    table = pd.crosstab(
        index=[wap_data["urban_rural"], wap_data["A01"]],
        columns=wap_data["survey_year"],
        values=wap_data[weight_col],
        aggfunc="sum",
    )
    table.index = table.index.set_levels(["Urban", "Rural"], level=0)
    table.index = table.index.set_levels(["Male", "Female"], level=1)
    table.index.names = ["Area of Residence", "Gender"]
    return table


def compute_ch2_age_profiles(wap_data, weight_col):
    age_5_bins = [16, 25, 35, 45, 55, 100]
    age_5_labels = ["16-24", "25-34", "35-44", "45-54", "55+"]
    age_5cat = pd.cut(
        wap_data["age"], bins=age_5_bins, labels=age_5_labels, right=False
    )
    table = pd.crosstab(
        index=age_5cat,
        columns=wap_data["survey_year"],
        values=wap_data[weight_col],
        aggfunc="sum",
    )
    table = table.div(table.sum(axis=0), axis=1) * 100
    table.index.name = "Age Cohort"
    return table


def compute_ch3_macro_trends(wap_data):
    records = []
    for year, wave_frame in wap_data.groupby("survey_year"):
        total_wap_w = wave_frame["weight"].sum()
        employed_w = wave_frame[wave_frame["lf_status"] == 1]["weight"].sum()
        unemployed_w = wave_frame[wave_frame["lf_status"] == 2]["weight"].sum()
        plf_w = wave_frame[wave_frame["plf_status"] == 1]["weight"].sum()
        tru_w = wave_frame[wave_frame["tru"] == 1]["weight"].sum()

        lf_w = employed_w + unemployed_w
        ext_lf_w = lf_w + plf_w

        lfpr = (lf_w / total_wap_w) * 100 if total_wap_w > 0 else np.nan
        ur1 = (unemployed_w / lf_w) * 100 if lf_w > 0 else np.nan
        lu2 = ((unemployed_w + tru_w) / lf_w) * 100 if lf_w > 0 else np.nan
        lu3 = ((unemployed_w + plf_w) / ext_lf_w) * 100 if ext_lf_w > 0 else np.nan
        luur = ((unemployed_w + tru_w + plf_w) / ext_lf_w) * 100 if ext_lf_w > 0 else np.nan

        records.append(
            {
                "Survey Year": int(year),
                "WAP Volume": total_wap_w,
                "LFPR (%)": round(lfpr, 1),
                "Unemployment Rate UR1 (%)": round(ur1, 1),
                "Underemployment Rate LU2 (%)": round(lu2, 1),
                "PLF Unemployed Rate LU3 (%)": round(lu3, 1),
                "Composite Underutilization LUUR (%)": round(luur, 1),
            }
        )
    return pd.DataFrame(records)


def compute_ch4_employment_status(wap_data, weight_col):
    if "D05" not in wap_data.columns:
        wap_data = wap_data.copy()
        wap_data["status_employment"] = np.nan
    else:
        conditions = [
            wap_data["D05"].isin([1, 2]),
            wap_data["D05"] == 3,
            wap_data["D05"] == 4,
            wap_data["D05"] == 5,
            wap_data["D05"] >= 6,
        ]
        choices = [1, 2, 3, 4, 5]
        wap_data["status_employment"] = np.select(
            conditions, choices, default=np.nan
        )

    table = pd.crosstab(
        index=wap_data["status_employment"],
        columns=wap_data["survey_year"],
        values=wap_data[weight_col],
        aggfunc="sum",
    )
    table = table.reindex(index=range(1, 6), fill_value=0)
    table.index = _CH4_STATUS_INDEX
    table.index.name = "Employment Status"
    return table


def compute_ch5_youth_metrics(wap_data, weight_col):
    wave_data = wap_data.copy()
    wave_data["is_youth"] = np.where(
        (wave_data["age"] >= 16) & (wave_data["age"] <= 30), 1, 0
    )

    if "E01" in wave_data.columns:
        wave_data["is_neet"] = np.where(
            (wave_data["is_youth"] == 1)
            & (wave_data["lf_status"].isin([2, 3]))
            & (wave_data["E01"].values != 1),
            1,
            0,
        )
    else:
        wave_data["is_neet"] = np.where(
            (wave_data["is_youth"] == 1) & (wave_data["lf_status"].isin([2, 3])), 1, 0
        )

    youth_metrics = []
    for year, wave in wave_data[wave_data["is_youth"] == 1].groupby("survey_year"):
        total_youth_w = wave["weight"].sum()
        unemployed_youth_w = wave[wave["lf_status"] == 2]["weight"].sum()
        employed_youth_w = wave[wave["lf_status"] == 1]["weight"].sum()
        neet_youth_w = wave[wave["is_neet"] == 1]["weight"].sum()

        youth_lf = employed_youth_w + unemployed_youth_w
        youth_ur1 = (
            (unemployed_youth_w / youth_lf) * 100 if youth_lf > 0 else np.nan
        )
        youth_neet_rate = (
            (neet_youth_w / total_youth_w) * 100 if total_youth_w > 0 else np.nan
        )

        youth_metrics.append(
            {
                "Survey Year": int(year),
                "Youth Population": total_youth_w,
                "Youth Unemployment Rate (%)": round(youth_ur1, 1),
                "Youth NEET Rate (%)": round(youth_neet_rate, 1),
            }
        )
    return pd.DataFrame(youth_metrics)


def compute_ch6_olf_characteristics(olf_data, weight_col):
    table = pd.crosstab(
        index=olf_data["foodstuff"],
        columns=olf_data["survey_year"],
        values=olf_data[weight_col],
        aggfunc="sum",
    )
    table = table.reindex(index=[0, 1], fill_value=0)
    table.index = ["Inactive / Other OLF", "Subsistence Foodstuff Producers"]
    table.index.name = "OLF Sub-Category"
    return table


def compute_ch7_informality_profiles(employed_data, weight_col):
    if "informal_flag" in employed_data.columns:
        employed_data = employed_data.copy()
        informal = employed_data["informal_flag"].values
    elif "D12" in employed_data.columns:
        employed_data = employed_data.copy()
        d12_vals = employed_data["D12"].values
        status_vals = (
            employed_data["status_employment"].values
            if "status_employment" in employed_data.columns
            else np.full(len(employed_data), np.nan)
        )
        informal = np.where(
            pd.notna(d12_vals),
            np.where(d12_vals == 1, 0, 1),
            np.where(np.isin(status_vals, [3, 5]), 1, 0),
        )
    else:
        employed_data = employed_data.copy()
        informal = np.where(
            np.isin(employed_data["status_employment"].values, [3, 5]), 1, 0
        )
    employed_data["informal_flag"] = informal

    table = pd.crosstab(
        index=employed_data["informal_flag"],
        columns=employed_data["survey_year"],
        values=employed_data[weight_col],
        aggfunc="sum",
    )
    table = table.reindex(index=[0, 1], fill_value=0)
    table = table.div(table.sum(axis=0), axis=1) * 100
    table.index = ["Formal Employment (%)", "Informal Employment (%)"]
    table.index.name = "Employment Type"
    return table
