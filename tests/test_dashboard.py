import sys, types, unittest
from unittest.mock import patch

if "dotenv" not in sys.modules:
    dotenv = types.ModuleType("dotenv"); dotenv.load_dotenv = lambda *a, **k: False; sys.modules["dotenv"] = dotenv

import pandas as pd

def _sample_panel():
    rows = []
    for year in (2024, 2025):
        for sex in (1, 2):
            for area in (1, 2):
                for status in (1, 2, 3):
                    rows.append({"survey_year": year, "A01": sex, "urban_rural": area, "age": 24 if status == 2 else 40,
                                 "weight": 100.0, "wap16": 1, "lf_status": status, "plf_status": 1 if status == 3 else 0,
                                 "tru": 0, "province": 11, "main_sect": "A" if status == 1 else None})
    return pd.DataFrame(rows)

class DashboardServiceTests(unittest.TestCase):
    def test_dashboard_service_payload_shape_and_rate_scale(self):
        from api.services import lfs_service
        with patch.object(lfs_service, "_ensure_pipeline", return_value=_sample_panel()):
            result = lfs_service.get_dashboard_summary(year=2025)
        self.assertTrue(result["success"])
        d = result["data"]
        self.assertEqual(d["selected_year"], 2025)
        self.assertEqual(set(d["filters"].keys()), {"year","sex","area","age_group","province"})
        s = d["summary"]
        self.assertAlmostEqual(s["lfpr"], 200/3, places=5)
        self.assertAlmostEqual(s["epr"], 100/3, places=5)
        self.assertAlmostEqual(s["unemployment_rate"], 50.0, places=5)

    def test_dashboard_service_years_2020_2025(self):
        from api.services import lfs_service
        sample = pd.concat([_sample_panel().assign(survey_year=y) for y in range(2020,2026)], ignore_index=True)
        with patch.object(lfs_service, "_ensure_pipeline", return_value=sample):
            for year in range(2020,2026):
                result = lfs_service.get_dashboard_summary(year=year)
                self.assertTrue(result["success"], msg=result)
                self.assertEqual(result["data"]["selected_year"], year)

    def test_dashboard_service_invalid_year_error_contract(self):
        from api.services import lfs_service
        with patch.object(lfs_service, "_ensure_pipeline", return_value=_sample_panel()):
            result = lfs_service.get_dashboard_summary(year=1999)
        self.assertFalse(result["success"])
        self.assertIn("Invalid year", result["error"])
        self.assertIn("summary", result["data"])
        self.assertEqual(result["data"]["summary"]["lfpr"], 0.0)

    def test_indicators_service_contract(self):
        from api.services import lfs_service
        with patch.object(lfs_service, "_ensure_pipeline", return_value=_sample_panel()):
            result = lfs_service.get_indicators(year=2025)
        self.assertTrue(result["success"])
        self.assertEqual(result["contract"]["rate_scale"], "percent_0_100")
        self.assertEqual(result["data"]["unemployment_rate"], 50.0)

if __name__ == "__main__":
    unittest.main()
