import unittest

from science.validate_temporal_pair import validate


class TemporalPairTests(unittest.TestCase):
    def test_temporal_pair_fixture_is_not_claimed_as_persistence(self) -> None:
        from pathlib import Path
        import tempfile

        import h5py

        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "pair.h5"
            output = Path(directory) / "temporal.json"
            with h5py.File(source, "w") as handle:
                identification = handle.create_group("science/LSAR/identification")
                gunw = handle.create_group("science/LSAR/GUNW/metadata/orbit")
                identification.create_dataset(
                    "referenceZeroDopplerStartTime", data=b"2008-10-12T00:00:00"
                )
                identification.create_dataset(
                    "secondaryZeroDopplerStartTime", data=b"2008-11-27T00:00:00"
                )
                identification.create_dataset("granuleId", data=b"fixture")
                gunw.create_dataset("temporalBaseline", data=46)

            result = validate(source, output)

        self.assertTrue(result["compatible_pair"])
        self.assertFalse(result["persistence_claim"])


if __name__ == "__main__":
    unittest.main()
