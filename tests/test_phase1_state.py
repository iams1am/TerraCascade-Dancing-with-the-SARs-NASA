import json
import unittest
from pathlib import Path


class PhaseOneStateTests(unittest.TestCase):
    def test_browser_data_status_has_verified_measurement(self) -> None:
        status = json.loads(
            Path("web/public/data/status.json").read_text(encoding="utf-8")
        )
        self.assertEqual(status["phase"], 11)
        self.assertEqual(status["status"], "processed_demo_available")
        self.assertEqual(
            status["measurementLayer"],
            "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/unwrappedPhase",
        )

    def test_provenance_keeps_source_and_units(self) -> None:
        provenance = json.loads(
            Path("web/public/data/provenance.json").read_text(encoding="utf-8")
        )
        self.assertEqual(provenance["mission"], "NASA-ISRO NISAR")
        self.assertEqual(provenance["product"], "GUNW")
        self.assertEqual(provenance["units"]["measurement"], "radians")
        self.assertTrue(provenance["source_url"].startswith("https://"))
        self.assertGreater(len(provenance["limitations"]), 0)

    def test_interactive_spatial_assets_are_generated(self) -> None:
        event = json.loads(
            Path("web/public/data/event.json").read_text(encoding="utf-8")
        )
        surface = json.loads(
            Path("web/public/data/surface.json").read_text(encoding="utf-8")
        )
        footprint = json.loads(
            Path("web/public/data/footprint.geojson").read_text(encoding="utf-8")
        )
        self.assertEqual(surface["phase_units"], "radians")
        self.assertEqual(event["imagery"], "/data/imagery/demo-region.png")
        self.assertTrue(event["map_overlay"].endswith("phase-overlay.png"))
        self.assertLess(event["context_bounds"]["south"], event["geographic_bounds"]["south"])
        self.assertGreater(event["context_bounds"]["north"], event["geographic_bounds"]["north"])
        self.assertLess(event["geographic_bounds"]["south"], event["geographic_bounds"]["north"])
        self.assertLess(event["geographic_bounds"]["west"], event["geographic_bounds"]["east"])
        self.assertEqual(len(surface["phase"]), surface["rows"] * surface["columns"])
        self.assertEqual(len(surface["coherence"]), surface["rows"] * surface["columns"])
        self.assertEqual(footprint["type"], "FeatureCollection")
        self.assertEqual(
            footprint["features"][0]["properties"]["projection"],
            "EPSG:32611",
        )


if __name__ == "__main__":
    unittest.main()
