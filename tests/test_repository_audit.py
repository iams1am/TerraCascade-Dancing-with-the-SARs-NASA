import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RepositoryAuditTests(unittest.TestCase):
    def test_provenance_contains_required_traceability(self) -> None:
        provenance = json.loads(
            (ROOT / "web/public/data/provenance.json").read_text(encoding="utf-8")
        )
        for key in (
            "mission",
            "product",
            "processing_level",
            "observation",
            "source_product",
            "source_url",
            "download_date",
            "processing",
            "units",
            "limitations",
        ):
            self.assertIn(key, provenance)
        self.assertTrue(provenance["source_url"].startswith("https://"))
        self.assertEqual(provenance["units"]["measurement"], "radians")

    def test_evidence_assets_use_only_allowed_labels(self) -> None:
        allowed = {"OBSERVED", "DERIVED", "CONTEXTUAL", "POTENTIAL"}
        cascade = json.loads(
            (ROOT / "web/public/data/cascade.json").read_text(encoding="utf-8")
        )
        for node in cascade["nodes"]:
            self.assertIn(node["evidence"], allowed)
            self.assertTrue(node["source"])
            self.assertTrue(node["limitation"])

    def test_frontend_contains_no_legacy_illustrative_measurements(self) -> None:
        forbidden = ("-4 mm", "-11 mm", "-19 mm", "-27 mm", "78/100")
        frontend_files = list((ROOT / "web/app").rglob("*")) + list(
            (ROOT / "web/components").rglob("*")
        )
        source = "\n".join(
            path.read_text(encoding="utf-8")
            for path in frontend_files
            if path.is_file() and path.suffix in {".ts", ".tsx", ".css"}
        )
        for value in forbidden:
            self.assertNotIn(value, source)

    def test_raw_product_is_ignored_and_processed_assets_are_small(self) -> None:
        ignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("data/raw/*", ignore)
        self.assertIn("data/processed/*", ignore)
        self.assertIn("*.tsbuildinfo", ignore)
        self.assertLess(
            (ROOT / "web/public/data/imagery/demo-region.png").stat().st_size,
            5_000_000,
        )


if __name__ == "__main__":
    unittest.main()
