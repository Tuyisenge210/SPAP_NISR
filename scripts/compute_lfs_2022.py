"""
Compute Rwanda LFS 2022 weighted indicators from the raw NISR .dta microdata.

Usage:
    pip install pyreadstat pandas
    python scripts/compute_lfs_2022.py path/to/RW_LFS2022.dta \
        > src/lib/lfs/baseline-2022.json

All ratios use the standard ILO weighted formula:
    rate = sum(weight_i * 1[i in numerator]) / sum(weight_i * 1[i in denominator])

Working-age population is persons aged 16+ (NISR convention).
The dataset already ships pre-derived ILO status: `status1` ∈ {1=Employed,
2=Unemployed, 3=Outside LF}; sampling weight is `weight2` (annual).
"""
from __future__ import annotations
import json
import sys
import pyreadstat


def pct(num: float, den: float) -> float:
    return 100.0 * num / den if den else 0.0


def main(path: str) -> dict:
    df, meta = pyreadstat.read_dta(path)
    w = df["weight2"]

    def wsum(mask) -> float:
        return float((w * mask).sum())

    wap = df["A04"] >= 16
    emp = (df["status1"] == 1) & wap
    une = (df["status1"] == 2) & wap
    olf = (df["status1"] == 3) & wap

    WAP, E, U, O = wsum(wap), wsum(emp), wsum(une), wsum(olf)
    LF = E + U

    out: dict = {
        "year": 2022,
        "source": "RW_LFS2022.dta (NISR)",
        "n_records": int(len(df)),
        "totals": {
            "working_age": WAP, "employed": E, "unemployed": U,
            "outside_lf": O, "labour_force": LF,
        },
        "headline": {"LFPR": pct(LF, WAP), "EPR": pct(E, WAP), "UR": pct(U, LF)},
        "by_sex": {}, "by_area": {}, "by_age": {},
        "by_province": {}, "underutilization": {},
    }

    for s, lab in [(1, "male"), (2, "female")]:
        m = df["A01"] == s
        e, u, wp = wsum(emp & m), wsum(une & m), wsum(wap & m)
        out["by_sex"][lab] = {
            "EPR": pct(e, wp), "UR": pct(u, e + u), "LFPR": pct(e + u, wp),
            "employed": e, "unemployed": u, "wap": wp,
        }
    for c, lab in [(1, "urban"), (2, "rural")]:
        m = df["Code_UR"] == c
        e, u, wp = wsum(emp & m), wsum(une & m), wsum(wap & m)
        out["by_area"][lab] = {"EPR": pct(e, wp), "UR": pct(u, e + u), "LFPR": pct(e + u, wp)}
    for lab, m in [
        ("youth_16_30", (df["A04"] >= 16) & (df["A04"] <= 30)),
        ("adult_31_plus", df["A04"] >= 31),
    ]:
        e, u, wp = wsum(emp & m), wsum(une & m), wsum(wap & m)
        out["by_age"][lab] = {"EPR": pct(e, wp), "UR": pct(u, e + u), "LFPR": pct(e + u, wp)}

    for v in ["LU2", "LU3", "LU4", "LUUR", "TRUR"]:
        out["underutilization"][v] = pct(wsum(df[v] == 100), wsum(df[v].notna()))

    for code, name in meta.variable_value_labels.get("province", {}).items():
        m = df["province"] == code
        e, u, wp = wsum(emp & m), wsum(une & m), wsum(wap & m)
        out["by_province"][name] = {
            "EPR": pct(e, wp), "UR": pct(u, e + u), "LFPR": pct(e + u, wp), "wap": wp,
        }
    return out


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "RW_LFS2022.dta"
    print(json.dumps(main(src), indent=2))
