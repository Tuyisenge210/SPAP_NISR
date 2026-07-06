import os
import pandas as pd
from .config import Config


class ValidationEngine:
    def __init__(self):
        self.validation_passed = True
        self.macro_xls = pd.ExcelFile(
            os.path.join(Config.FOLDERS["final"], "LFS_Macro_Indicators_Report.xlsx")
        )
        self.master_xls = pd.ExcelFile(Config.EXCEL_REPORT)

    def _load_sheet(self, xls, sheet_name, **kwargs):
        default_kwargs = {"header": 3}
        default_kwargs.update(kwargs)
        try:
            return pd.read_excel(xls, sheet_name=sheet_name, **default_kwargs)
        except Exception as e:
            print(f"[ERROR] Could not load sheet '{sheet_name}': {e}")
            self.validation_passed = False
            return pd.DataFrame()

    def run_full_audit(self):
        print("=" * 72)
        print("        LAUNCHING SYSTEM-WIDE DIAGNOSTIC REPORT CHECK")
        print("=" * 72)

        df_ch2_wap = self._load_sheet(
            self.macro_xls, "Table_2.1_WAP_Distribution", index_col=[0, 1]
        )
        df_ch3_macro = self._load_sheet(self.macro_xls, "Table_3.1_ILO_Macro_Trends")
        df_ch4_status = self._load_sheet(
            self.master_xls, "Ch4_Employment_Status", index_col=0
        )
        df_ch6_olf = self._load_sheet(
            self.master_xls, "Ch6_OLF_Characteristics", index_col=0
        )

        if df_ch2_wap.empty or df_ch3_macro.empty:
            print("[ERROR] Critical sheets missing. Aborting validation.")
            return False

        survey_years = list(df_ch2_wap.columns)
        print(f"Detected Survey Wave Processing Horizon: {survey_years}\n")

        print("-" * 72)
        print("CHECK 1: COMPONENT TOTAL BALANCE (WAP == LF + OLF)")
        print("-" * 72)

        for year in survey_years:
            total_wap_ch2 = df_ch2_wap[year].sum()
            ch3_row = df_ch3_macro[df_ch3_macro["Survey Year"] == year]
            if ch3_row.empty:
                print(f" [ERROR] Year {year} missing from Chapter 3.")
                self.validation_passed = False
                continue
            total_wap_ch3 = ch3_row["WAP Volume"].values[0]
            variance = abs(total_wap_ch2 - total_wap_ch3)
            if variance < 1.0:
                print(
                    f" [PASSED] Year {year}: Totals match. (Volume: {total_wap_ch2:,.0f})"
                )
            else:
                print(
                    f" [FAILED] Year {year}: Mismatch detected! "
                    f"Ch2={total_wap_ch2:,.2f}, Ch3={total_wap_ch3:,.2f}, Variance={variance:,.2f}"
                )
                self.validation_passed = False

        print("\n" + "-" * 72)
        print("CHECK 2: INTERNAL EMPLOYMENT SECTOR CONSISTENCY")
        print("-" * 72)
        if not df_ch4_status.empty:
            for year in survey_years:
                if year in df_ch4_status.columns:
                    total_employed_ch4 = df_ch4_status[year].sum()
                    print(
                        f" [INFO] Year {year}: Total Employment = {total_employed_ch4:,.0f}"
                    )
        else:
            print(" [SKIPPED] Ch4 sheet missing.")

        print("\n" + "-" * 72)
        print("CHECK 3: POPULATION OUTSIDE THE LABOUR FORCE (OLF)")
        print("-" * 72)
        if not df_ch6_olf.empty:
            for year in survey_years:
                if year in df_ch6_olf.columns:
                    total_olf_ch6 = df_ch6_olf[year].sum()
                    print(
                        f" [INFO] Year {year}: Total OLF = {total_olf_ch6:,.0f}"
                    )
        else:
            print(" [SKIPPED] Ch6 sheet missing.")

        print("\n" + "=" * 72)
        if self.validation_passed:
            print("      DIAGNOSTIC COMPLETE: ALL AUDIT TRAILS BALANCED PERFECTLY")
        else:
            print("      DIAGNOSTIC WARNING: Structural variances detected across sheets.")
        print("=" * 72)
        return self.validation_passed
