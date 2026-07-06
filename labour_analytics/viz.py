import os
import numpy as np
import pandas as pd
from .config import Config


def to_long_format(df, value_name="Value"):
    if isinstance(df.index, pd.MultiIndex):
        df_reset = df.reset_index()
        id_vars = list(df_reset.columns[: df.index.nlevels])
    else:
        df_reset = df.reset_index()
        id_vars = [df.index.name or "index"]
    return df_reset.melt(id_vars=id_vars, var_name="Year", value_name=value_name)


def export_visualization_ready_datasets(master_panel, output_folder=None):
    if output_folder is None:
        output_folder = Config.FOLDERS["viz"]
    os.makedirs(output_folder, exist_ok=True)

    gender_col, weight_col = _resolve_analysis_columns(master_panel)
    wap = master_panel[master_panel["wap16"] == 1].copy()
    olf = wap[wap["lf_status"] == 3].copy()
    employed = wap[wap["lf_status"] == 1].copy()

    datasets = {}

    datasets["table_2_1"] = to_long_format(
        _compute_ch2_wap(wap, weight_col), value_name="Population"
    )
    datasets["table_2_2"] = to_long_format(
        _compute_ch2_age(wap, weight_col), value_name="Share (%)"
    )
    datasets["table_3_1"] = _compute_ch3_long(wap)
    datasets["table_4_1"] = to_long_format(
        _compute_ch4(employed, weight_col), value_name="Population"
    )
    datasets["table_5_1"] = _compute_ch5_long(wap, gender_col)
    datasets["table_6_1"] = to_long_format(
        _compute_ch6(olf, weight_col), value_name="Population"
    )
    datasets["table_7_1"] = to_long_format(
        _compute_ch7(employed, weight_col), value_name="Share (%)"
    )

    for name, df_long in datasets.items():
        out_path = os.path.join(
            output_folder, f"viz_{name}_long.parquet"
        )
        df_long.to_parquet(out_path, index=False)

    return datasets


def _resolve_analysis_columns(master_panel):
    from .harmonizer import resolve_column

    gender_col = resolve_column(master_panel, ["A01", "a01"])
    weight_col = resolve_column(master_panel, ["weight", "Weight", "weight2"])
    return gender_col, weight_col


def _compute_ch2_wap(wap, weight_col):
    import pandas as pd

    table = pd.crosstab(
        index=[wap["urban_rural"], wap["A01"]],
        columns=wap["survey_year"],
        values=wap[weight_col],
        aggfunc="sum",
    )
    table.index = table.index.set_levels(["Urban", "Rural"], level=0)
    table.index = table.index.set_levels(["Male", "Female"], level=1)
    table.index.names = ["Area of Residence", "Gender"]
    return table


def _compute_ch2_age(wap, weight_col):
    age_5_bins = [16, 25, 35, 45, 55, 100]
    age_5_labels = ["16-24", "25-34", "35-44", "45-54", "55+"]
    age_5cat = pd.cut(
        wap["age"], bins=age_5_bins, labels=age_5_labels, right=False
    )
    table = pd.crosstab(
        index=age_5cat,
        columns=wap["survey_year"],
        values=wap[weight_col],
        aggfunc="sum",
    )
    table = table.div(table.sum(axis=0), axis=1) * 100
    table.index.name = "Age Cohort"
    return table


def _compute_ch3_long(wap):
    records = []
    for year, wave_frame in wap.groupby("survey_year"):
        total_wap_w = wave_frame["weight"].sum()
        emp_w = wave_frame[wave_frame["lf_status"] == 1]["weight"].sum()
        unemp_w = wave_frame[wave_frame["lf_status"] == 2]["weight"].sum()
        plf_w = wave_frame[wave_frame["plf_status"] == 1]["weight"].sum()
        tru_w = wave_frame[wave_frame["tru"] == 1]["weight"].sum()
        lf_w = emp_w + unemp_w
        ext_lf_w = lf_w + plf_w

        records.append(
            {
                "Survey Year": int(year),
                "WAP Volume": total_wap_w,
                "LFPR (%)": round((lf_w / total_wap_w) * 100, 1)
                if total_wap_w > 0
                else None,
                "Unemployment Rate UR1 (%)": round(
                    (unemp_w / lf_w) * 100, 1
                )
                if lf_w > 0
                else None,
                "Underemployment Rate LU2 (%)": round(
                    ((unemp_w + tru_w) / lf_w) * 100, 1
                )
                if lf_w > 0
                else None,
                "PLF Unemployed Rate LU3 (%)": round(
                    ((unemp_w + plf_w) / ext_lf_w) * 100, 1
                )
                if ext_lf_w > 0
                else None,
                "Composite Underutilization LUUR (%)": round(
                    ((unemp_w + tru_w + plf_w) / ext_lf_w) * 100, 1
                )
                if ext_lf_w > 0
                else None,
            }
        )
    return pd.DataFrame(records)


def _compute_ch4(employed, weight_col):
    if "D05" not in employed.columns:
        return pd.DataFrame()

    conditions = [
        employed["D05"].isin([1, 2]),
        employed["D05"] == 3,
        employed["D05"] == 4,
        employed["D05"] == 5,
        employed["D05"] >= 6,
    ]
    choices = [1, 2, 3, 4, 5]
    status_emp = pd.Series(
        np.select(conditions, choices, default=np.nan),
        index=employed.index,
    )
    table = pd.crosstab(
        index=status_emp,
        columns=employed["survey_year"],
        values=employed[weight_col],
        aggfunc="sum",
    )
    table.index = [
        "Employee",
        "Employer",
        "Own Account Worker",
        "Cooperative Member",
        "Contributing Family Worker",
    ]
    table.index.name = "Employment Status"
    return table


def _compute_ch5_long(wap, gender_col):
    wap_copy = wap.copy()
    wap_copy["is_youth"] = np.where(
        (wap_copy["age"] >= 16) & (wap_copy["age"] <= 30), 1, 0
    )
    if "E01" in wap_copy.columns:
        wap_copy["is_neet"] = np.where(
            (wap_copy["is_youth"] == 1)
            & (wap_copy["lf_status"].isin([2, 3]))
            & (wap_copy["E01"].values != 1),
            1,
            0,
        )
    else:
        wap_copy["is_neet"] = np.where(
            (wap_copy["is_youth"] == 1) & (wap_copy["lf_status"].isin([2, 3])), 1, 0
        )

    records = []
    for year, wave in wap_copy[wap_copy["is_youth"] == 1].groupby("survey_year"):
        total_youth_w = wave["weight"].sum()
        unemployed_youth_w = wave[wave["lf_status"] == 2]["weight"].sum()
        employed_youth_w = wave[wave["lf_status"] == 1]["weight"].sum()
        neet_youth_w = wave[wave["is_neet"] == 1]["weight"].sum()
        youth_lf = employed_youth_w + unemployed_youth_w
        youth_ur1 = (
            (unemployed_youth_w / youth_lf) * 100 if youth_lf > 0 else None
        )
        youth_neet_rate = (
            (neet_youth_w / total_youth_w) * 100
            if total_youth_w > 0
            else None
        )
        records.append(
            {
                "Survey Year": int(year),
                "Youth Population": total_youth_w,
                "Youth Unemployment Rate (%)": round(youth_ur1, 1)
                if youth_ur1 is not None
                else None,
                "Youth NEET Rate (%)": round(youth_neet_rate, 1)
                if youth_neet_rate is not None
                else None,
            }
        )
    return pd.DataFrame(records)


def _compute_ch6(olf, weight_col):
    table = pd.crosstab(
        index=olf["foodstuff"],
        columns=olf["survey_year"],
        values=olf[weight_col],
        aggfunc="sum",
    )
    table.index = [
        "Inactive / Other OLF",
        "Subsistence Foodstuff Producers",
    ]
    table.index.name = "OLF Sub-Category"
    return table


def _compute_ch7(employed, weight_col):
    if "informal_flag" in employed.columns:
        col = "informal_flag"
    elif "D12" in employed.columns:
        col = "D12"
        employed = employed.copy()
        employed["informal_flag"] = np.where(
            employed["D12"].values == 1, 0, 1
        )
        col = "informal_flag"
    else:
        col = "status_employment"
        employed = employed.copy()
        employed["informal_flag"] = np.where(
            employed["status_employment"].isin([3, 5]), 1, 0
        )

    table = pd.crosstab(
        index=employed["informal_flag"],
        columns=employed["survey_year"],
        values=employed[weight_col],
        aggfunc="sum",
    )
    table = table.div(table.sum(axis=0), axis=1) * 100
    table.index = ["Formal Employment (%)", "Informal Employment (%)"]
    table.index.name = "Employment Type"
    return table
