"""Validate the two acquisition dates available in one GUNW product.

This phase refuses to manufacture a persistent time series. It records the
reference and secondary acquisitions and explicitly marks the limitation.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import h5py

REFERENCE_PATH = "science/LSAR/identification/referenceZeroDopplerStartTime"
SECONDARY_PATH = "science/LSAR/identification/secondaryZeroDopplerStartTime"
BASELINE_PATH = "science/LSAR/GUNW/metadata/orbit/temporalBaseline"
GRANULE_PATH = "science/LSAR/identification/granuleId"


def decode(value: Any) -> str | int:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if hasattr(value, "item"):
        return decode(value.item())
    return value


def validate(input_path: Path, output_path: Path) -> dict[str, Any]:
    """Validate ordering and write an auditable pair record."""
    with h5py.File(input_path, "r") as handle:
        reference = str(decode(handle[REFERENCE_PATH][()]))
        secondary = str(decode(handle[SECONDARY_PATH][()]))
        baseline = int(decode(handle[BASELINE_PATH][()]))
        granule = str(decode(handle[GRANULE_PATH][()]))

    if reference >= secondary:
        raise ValueError("reference acquisition must precede secondary acquisition")
    if baseline <= 0:
        raise ValueError("temporal baseline must be positive")

    result = {
        "source_file": str(input_path),
        "source_product": granule,
        "observations": [
            {"id": "reference", "date": reference, "role": "reference_acquisition"},
            {"id": "secondary", "date": secondary, "role": "secondary_acquisition"},
        ],
        "temporal_baseline_days": baseline,
        "compatible_pair": True,
        "persistence_claim": False,
        "limitation": (
            "Only one interferogram pair is available. This validates temporal "
            "separation but does not establish persistence across multiple pairs."
        ),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=None)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/processed/demo_region/temporal_validation.json"),
    )
    args = parser.parse_args()
    input_path = args.input
    if input_path is None:
        candidates = sorted(Path("data/raw").glob("*.h5"))
        if len(candidates) != 1:
            raise SystemExit("Specify --input when data/raw does not contain exactly one .h5 file.")
        input_path = candidates[0]
    result = validate(input_path, args.output)
    web_output = Path("web/public/data/temporal-validation.json")
    web_output.parent.mkdir(parents=True, exist_ok=True)
    web_output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Reference: {result['observations'][0]['date']}")
    print(f"Secondary: {result['observations'][1]['date']}")
    print(f"Temporal baseline: {result['temporal_baseline_days']} days")
    print(f"Persistence claim: {result['persistence_claim']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
