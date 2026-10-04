import logging
import os

from .config import Config
from .harmonizer import build_master_panel
from .indicators import compute_all_indicators
from .publisher import ExcelPublisher
from .production_catalogue import write_catalogue
from .table_engine import CHAPTER_TABLE_CATALOGUE, LEGACY_TABLE_CATALOGUE, produce_tables
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

        self.table_run = produce_tables(self.master_panel)

        macro_report_path = os.path.join(
            Config.FOLDERS["final"], "LFS_Macro_Indicators_Report.xlsx"
        )
        master_report_path = Config.EXCEL_REPORT

        with ExcelPublisher(macro_report_path) as macro_pub:
            self._write_tables(macro_pub, {"Chapter 2", "Chapter 3"})

        with ExcelPublisher(master_report_path) as master_pub:
            self._write_tables(master_pub, {"Chapter 4", "Chapter 5", "Chapter 6", "Chapter 7"})

        with ExcelPublisher(Config.MAIN_TABLE_REPORT) as chapter_pub:
            for definition in CHAPTER_TABLE_CATALOGUE:
                table = self.table_run.tables[definition.table_id]
                number_formats = {
                    column: "0.0" if "%" in str(column) else "#,##0"
                    for column in table.select_dtypes(include="number").columns
                }
                chapter_pub.write_sheet(
                    table,
                    sheet_name=definition.sheet_name,
                    title=definition.title,
                    number_format=number_formats,
                )

            self.master_panel.to_parquet(Config.FINAL_PARQUET, index=False)
            write_catalogue(Config.FOLDERS["final"])
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

    def _write_tables(self, publisher, chapters):
        for definition in LEGACY_TABLE_CATALOGUE:
            if definition.chapter not in chapters:
                continue
            publisher.write_sheet(
                self.table_run.tables[definition.table_id],
                sheet_name=definition.sheet_name,
                title=definition.title,
                number_format=definition.number_format,
            )

    def execute(self):
        self.run_phase1()
        self.run_phase2()
        self.run_phase3()
        self.run_cleanup()
        self.run_validation()
        self.logger.info("Pipeline execution finished successfully.")
