import unittest

import numpy as np

from science.extract_demo_region import build_valid_mask, polygon_center


class DemoRegionTests(unittest.TestCase):
    def test_region_quality_mask_keeps_documented_land_pixel(self) -> None:
        phase = np.array([[1.0]])
        coherence = np.array([[0.5]])
        quality_mask = np.array([[11]], dtype=np.uint8)

        valid = build_valid_mask(phase, coherence, quality_mask, 0.3)

        self.assertTrue(bool(valid[0, 0]))

    def test_polygon_center_reads_longitude_and_latitude_order(self) -> None:
        latitude, longitude = polygon_center("POLYGON ((-118 34, -117 34, -117 35, -118 35))")

        self.assertAlmostEqual(latitude, 34.5)
        self.assertAlmostEqual(longitude, -117.5)


if __name__ == "__main__":
    unittest.main()
