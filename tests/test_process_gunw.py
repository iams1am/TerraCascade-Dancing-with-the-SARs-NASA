import unittest

import numpy as np

from science.process_gunw import build_valid_mask, phase_statistics


class GunwProcessingTests(unittest.TestCase):
    def test_valid_mask_applies_coherence_and_subswath_rules(self) -> None:
        phase = np.array([[1.0, 2.0, np.nan, 4.0]])
        coherence = np.array([[0.8, 0.2, 0.9, 0.9]])
        quality_mask = np.array([[11, 11, 11, 111]], dtype=np.uint8)

        valid = build_valid_mask(phase, coherence, quality_mask, 0.3)

        np.testing.assert_array_equal(valid, np.array([[True, False, False, False]]))

    def test_fill_and_zero_subswath_are_invalid(self) -> None:
        phase = np.ones((1, 3))
        coherence = np.ones((1, 3))
        quality_mask = np.array([[255, 10, 11]], dtype=np.uint8)

        valid = build_valid_mask(phase, coherence, quality_mask, 0.0)

        np.testing.assert_array_equal(valid, np.array([[False, False, True]]))

    def test_statistics_use_only_valid_pixels(self) -> None:
        phase = np.array([[1.0, 8.0, 3.0]])
        valid = np.array([[True, False, True]])

        self.assertEqual(
            phase_statistics(phase, valid),
            {
                "valid_pixel_count": 2,
                "minimum": 1.0,
                "maximum": 3.0,
                "median": 2.0,
                "mean": 2.0,
            },
        )


if __name__ == "__main__":
    unittest.main()
