import re
import numpy as np
import pandas as pd
from .harmonizer import resolve_column


def resolve_year_column(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def compute_all_indicators(master_panel):
    status_col = resolve_year_column(master_panel, ["status1", "status", "STATUS"])
    plf_col = resolve_year_column(master_panel, ["PLF", "plf"])
    djs_col = resolve_year_column(master_panel, ["DJS", "djs"])
    hours_col = resolve_year_column(master_panel, ["hours_worked", "act_hrs", "hours"])
    want_col = resolve_year_column(master_panel, ["want_more_hours", "want_more"])

    age = master_panel["age"].values
    wap16 = np.where((age >= 16) & ~pd.isna(master_panel["age"].values), 1, 0)

    if status_col and status_col in master_panel.columns:
        status_vals = master_panel[status_col].values
        lf_status = np.select(
            [
                (status_vals == 1) & (wap16 == 1),
                (status_vals == 2) & (wap16 == 1),
                np.isin(status_vals, [3, 4]) & (wap16 == 1),
            ],
            [1, 2, 3],
            default=np.nan,
        )
    else:
        lf_status = np.full(len(master_panel), np.nan)

    foodstuff = np.where(wap16 == 1, 0, np.nan)
    if plf_col and plf_col in master_panel.columns:
        foodstuff = np.where(
            (master_panel[plf_col].values == 2) & (wap16 == 1), 1, foodstuff
        )

    discourage = np.where(wap16 == 1, 0, np.nan)
    if djs_col and djs_col in master_panel.columns:
        discourage = np.where(
            (master_panel[djs_col].values == 100) & (wap16 == 1), 1, discourage
        )

    plf_status = np.where(wap16 == 1, 0, np.nan)
    if plf_col and plf_col in master_panel.columns:
        plf_status = np.where(
            (lf_status == 3) & ((discourage == 1) | (master_panel[plf_col].values == 1)),
            1,
            plf_status,
        )
    else:
        plf_status = np.where(
            (lf_status == 3) & (discourage == 1), 1, plf_status
        )

    tru = np.where(lf_status == 1, 0, np.nan)
    if hours_col and hours_col in master_panel.columns and want_col and want_col in master_panel.columns:
        tru = np.where(
            (lf_status == 1)
            & (master_panel[hours_col].values < 35)
            & (master_panel[want_col].values == 1),
            1,
            tru,
        )

    extended_lf = np.where(
        np.isin(lf_status, [1, 2]) | (plf_status == 1), 1, 0
    )

    indicators_df = pd.DataFrame(
        {
            "wap16": wap16,
            "lf_status": lf_status,
            "foodstuff": foodstuff,
            "discourage": discourage,
            "plf_status": plf_status,
            "tru": tru,
            "extended_lf": extended_lf,
        },
        index=master_panel.index,
    )
    overlap_cols = [
        c for c in indicators_df.columns if c in master_panel.columns
    ]
    if overlap_cols:
        master_panel = master_panel.drop(columns=overlap_cols)
    return pd.concat([master_panel, indicators_df], axis=1)
