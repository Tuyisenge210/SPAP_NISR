import unittest

import pandas as pd

from labour_analytics.chapters import chapter_table_catalogue, produce_chapter_tables
from labour_analytics.table_engine import produce_tables


def sample_panel():
    records = []
    for year in (2024, 2025):
        for province in range(1, 6):
            for district in (province * 10 + 1, province * 10 + 2):
                for sex in (1, 2):
                    for area in (1, 2):
                        for status in (1, 2, 3):
                            records.append(
                                {
                                    "survey_year": year,
                                    "province": province,
                                    "district": district,
                                    "A01": sex,
                                    "urban_rural": area,
                                    "age": 22 if status == 2 else 38,
                                    "wap16": 1,
                                    "lf_status": status,
                                    "weight": 10.0,
                                    "attained": 2,
                                    "sub": status % 2,
                                    "isic2digitdigit": 1,
                                    "isco2digit": 2,
                                    "main_sect": 1,
                                    "D04": 1,
                                    "D05": 1 if status == 1 else None,
                                    "D12": 1,
                                    "IEV2": 1 if status == 1 else None,
                                    "Prod_unit": 1,
                                    "C04": 1 if sex == 1 else 2,
                                    "foodstuff": status % 2,
                                    "plf_status": 1 if status == 3 else 0,
                                    "tru": 0,
                                }
                            )
    return pd.DataFrame(records)


class ChapterTableProductionTests(unittest.TestCase):
    def test_catalogue_and_producer_ids_match(self):
        tables = produce_chapter_tables(sample_panel())
        catalogue_ids = {entry["table_id"] for entry in chapter_table_catalogue()}

        self.assertEqual(len(catalogue_ids), 35)
        self.assertEqual(set(tables), catalogue_ids)
        self.assertTrue(all(isinstance(table, pd.DataFrame) for table in tables.values()))

    def test_national_summary_uses_weighted_denominators(self):
        result = produce_chapter_tables(sample_panel())["main_table_1"]

        self.assertEqual(result["Working-age population"].iloc[0], 1200.0)
        self.assertAlmostEqual(result["LFPR (%)"].iloc[0], 200 / 3)

    def test_full_engine_keeps_five_district_tables(self):
        result = produce_tables(sample_panel())

        self.assertEqual(len(result.tables), 42)
        self.assertTrue(set(f"main_table_{number}" for number in range(21, 26)).issubset(result.tables))
        self.assertEqual(len(result.tables["main_table_21"]), 4)
        self.assertEqual(len(result.as_records()["main_table_25"]), 4)

    def test_table_20_uses_employed_workforce_denominator(self):
        table = produce_chapter_tables(sample_panel())["main_table_20"]

        self.assertEqual(table["Share of employed workforce (%)"].iloc[0], 50.0)

    def test_missing_province_codes_keep_empty_table_slots(self):
        panel = sample_panel().loc[lambda frame: frame["province"] == 1]
        tables = produce_chapter_tables(panel)

        self.assertEqual(len(tables["main_table_21"]), 4)
        for number in range(22, 26):
            self.assertTrue(tables[f"main_table_{number}"].empty)


if __name__ == "__main__":
    unittest.main()