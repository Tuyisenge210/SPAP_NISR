import logging
import os
import pandas as pd

from .config import Config
from .harmonizer import build_master_panel
from .indicators import compute_all_indicators
from .analysis import (
    compute_ch2_wap_distribution,
    compute_ch2_age_profiles,
    compute_ch3_macro_trends,
    compute_ch4_employment_status,
    compute_ch5_youth_metrics,
    compute_ch6_olf_characteristics,
    compute_ch7_informality_profiles,
)
from .publisher import ExcelPublisher
from .validation import ValidationEngine
from .viz import export_visualization_ready_datasets


def setup_logging():
    log_path = os.path.join(Config.ROOT_DIR, "labour_analytics.log")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


class Pipeline:
    def __init__(self):
        Config.ensure_folders()
        setup_logging()
        self.logger = logging.getLogger(__name__)
        self.master_panel = None
        self.wap_data = None

    def run_phase1(self):
        self.logger.info("Phase 1: Integration and Harmonization starting...")
        self.master_panel = build_master_panel()
        self.logger.info(
            f"Phase 1 complete. Total records: {self.master_panel.shape[0]}"
        )

    def run_phase2(self):
        self.logger.info("Phase 2: Indicator computation starting...")
        self.master_panel = compute_all_indicators(self.master_panel)
        self.logger.info("Phase 2 complete. Indicators computed.")

    def run_phase3(self):
        self.logger.info("Phase 3: Analysis and export starting...")

        if self.master_panel is None:
            raise RuntimeError("Master panel not built. Run Phase 1 first.")

        if "weight" in self.master_panel.columns:
            weight_col = "weight"
        elif "weight2" in self.master_panel.columns:
            weight_col = "weight2"
        elif "Weight" in self.master_panel.columns:
            weight_col = "Weight"
        else:
            raise RuntimeError("No weight column found in master panel.")

        self.wap_data = self.master_panel[self.master_panel["wap16"] == 1].copy()

        macro_report_path = os.path.join(
            Config.FOLDERS["final"], "LFS_Macro_Indicators_Report.xlsx"
        )
        master_report_path = Config.EXCEL_REPORT

        with ExcelPublisher(macro_report_path) as macro_pub:
            self._write_chapter2(macro_pub, weight_col)
            self._write_chapter3(macro_pub)

        with ExcelPublisher(master_report_path) as master_pub:
            self._write_chapter4(master_pub, weight_col)
            self._write_chapter5(master_pub, weight_col)
            self._write_chapter6(master_pub, weight_col)
            self._write_chapter7(master_pub, weight_col)

        export_visualization_ready_datasets(self.master_panel)
        self.logger.info("Phase 3 complete. Tables exported.")

    def run_cleanup(self):
        active_years = sorted(
            self.master_panel["survey_year"].unique().astype(int)
        )
        for year in active_years:
            temp_target = os.path.join(
                Config.FOLDERS["temp"], f"harmonized_{year}.dta"
            )
            if os.path.exists(temp_target):
                os.remove(temp_target)
                self.logger.info(f"Removed temp file: {temp_target}")

    def run_validation(self):
        self.logger.info("Validation starting...")
        engine = ValidationEngine()
        passed = engine.run_full_audit()
        self.logger.info(
            f"Validation {'PASSED' if passed else 'FAILED'}."
        )
        return passed

    def _write_chapter2(self, publisher, weight_col):
        self.logger.info("Writing Chapter 2 tables...")
        table_21 = compute_ch2_wap_distribution(self.wap_data, weight_col)
        publisher.write_sheet(
            table_21,
            sheet_name="Table_2.1_WAP_Distribution",
            title="Table 2.1: Working Age Population Distribution by Area of Residence and Gender",
            number_format="#,##0",
        )

        table_22 = compute_ch2_age_profiles(self.wap_data, weight_col)
        publisher.write_sheet(
            table_22,
            sheet_name="Table_2.2_Age_Profiles",
            title="Table 2.2: Weighted Age Cohort Distribution (%)",
            number_format="0.0",
        )

    def _write_chapter3(self, publisher):
        self.logger.info("Writing Chapter 3 tables...")
        macro = compute_ch3_macro_trends(self.wap_data)
        publisher.write_sheet(
            macro,
            sheet_name="Table_3.1_ILO_Macro_Trends",
            title="Table 3.1: ILO Macro Trends (WAP Volume, LFPR, UR1, LU2, LU3, LUUR)",
            number_format="0.0",
        )

    def _write_chapter4(self, publisher, weight_col):
        self.logger.info("Writing Chapter 4 tables...")
        ch4 = compute_ch4_employment_status(self.wap_data, weight_col)
        publisher.write_sheet(
            ch4,
            sheet_name="Ch4_Employment_Status",
            title="Chapter 4: Employment Status in Employment (D05)",
            number_format="#,##0",
        )

    def _write_chapter5(self, publisher, weight_col):
        self.logger.info("Writing Chapter 5 tables...")
        ch5 = compute_ch5_youth_metrics(self.wap_data, weight_col)
        publisher.write_sheet(
            ch5,
            sheet_name="Ch5_Youth_NEET_Metrics",
            title="Chapter 5: Youth Unemployment and NEET Metrics",
            number_format="#,##0",
        )

    def _write_chapter6(self, publisher, weight_col):
        self.logger.info("Writing Chapter 6 tables...")
        olf_data = self.wap_data[self.wap_data["lf_status"] == 3].copy()
        ch6 = compute_ch6_olf_characteristics(olf_data, weight_col)
        publisher.write_sheet(
            ch6,
            sheet_name="Ch6_OLF_Characteristics",
            title="Chapter 6: Characteristics of Persons Outside the Labour Force",
            number_format="#,##0",
        )

    def _write_chapter7(self, publisher, weight_col):
        self.logger.info("Writing Chapter 7 tables...")
        employed_data = self.wap_data[self.wap_data["lf_status"] == 1].copy()
        ch7 = compute_ch7_informality_profiles(employed_data, weight_col)
        publisher.write_sheet(
            ch7,
            sheet_name="Ch7_Informality_Profiles",
            title="Chapter 7: Informal Sector and Informal Employment (%)",
            number_format="0.0",
        )

    def execute(self):
        self.run_phase1()
        self.run_phase2()
        self.run_phase3()
        self.run_cleanup()
        self.run_validation()
        self.logger.info("Pipeline execution finished successfully.")
