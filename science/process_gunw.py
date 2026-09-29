"""Create a validated scientific preview from one inspected NISAR GUNW file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import h5py
import numpy as np

PHASE_PATH = (
    "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/"
    "HH/unwrappedPhase"
)
COHERENCE_PATH = (
    "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/"
    "HH/coherenceMagnitude"
)
MASK_PATH = "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/mask"
X_COORDINATES_PATH = (
    "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/xCoordinates"
)
Y_COORDINATES_PATH = (
    "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/yCoordinates"
)
PROJECTION_PATH = "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/projection"
BOUNDING_POLYGON_PATH = "science/LSAR/identification/boundingPolygon"
GRANULE_ID_PATH = "science/LSAR/identification/granuleId"
PRODUCT_TYPE_PATH = "science/LSAR/identification/productType"
PRODUCT_LEVEL_PATH = "science/LSAR/identification/productLevel"
REFERENCE_START_PATH = "science/LSAR/identification/referenceZeroDopplerStartTime"
SECONDARY_START_PATH = "science/LSAR/identification/secondaryZeroDopplerStartTime"
TEMPORAL_BASELINE_PATH = "science/LSAR/GUNW/metadata/orbit/temporalBaseline"


def decode(value: Any) -> Any:
    """Convert HDF5 and NumPy values into JSON-safe values."""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if hasattr(value, "tolist"):
        return decode(value.tolist())
    if hasattr(value, "item"):
        return decode(value.item())
    if isinstance(value, float) and not np.isfinite(value):
        return str(value)
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def scalar(handle: h5py.File, path: str) -> Any:
    """Read and decode a scalar HDF5 dataset."""
    return decode(handle[path][()])


def build_valid_mask(
    phase: np.ndarray,
    coherence: np.ndarray,
    quality_mask: np.ndarray,
    minimum_coherence: float,
) -> np.ndarray:
    """Apply the documented GUNW mask semantics and coherence threshold."""
    if phase.shape != coherence.shape or phase.shape != quality_mask.shape:
        raise ValueError("phase, coherence, and quality mask must have equal shapes")
    if not 0 <= minimum_coherence <= 1:
        raise ValueError("minimum_coherence must be between 0 and 1")

    water_flag = quality_mask // 100
    reference_subswath = (quality_mask // 10) % 10
    secondary_subswath = quality_mask % 10
    return (
        np.isfinite(phase)
        & np.isfinite(coherence)
        & (quality_mask != 255)
        & (water_flag == 0)
        & (reference_subswath != 0)
        & (secondary_subswath != 0)
        & (coherence >= minimum_coherence)
    )


def phase_statistics(phase: np.ndarray, valid: np.ndarray) -> dict[str, float | int]:
    """Summarize only valid unwrapped-phase pixels."""
    values = phase[valid]
    if values.size == 0:
        raise ValueError("quality filtering removed every phase pixel")
    return {
        "valid_pixel_count": int(values.size),
        "minimum": float(np.min(values)),
        "maximum": float(np.max(values)),
        "median": float(np.median(values)),
        "mean": float(np.mean(values)),
    }


def render_preview(
    phase: np.ndarray,
    coherence: np.ndarray,
    valid: np.ndarray,
    x_coordinates: np.ndarray,
    y_coordinates: np.ndarray,
    output: Path,
    title: str,
    projection: str,
) -> None:
    """Render phase and coherence in the source projected coordinate system."""
    try:
        import matplotlib.pyplot as plt
    except ImportError as error:
        raise RuntimeError("Install matplotlib to render the scientific preview") from error

    output.parent.mkdir(parents=True, exist_ok=True)
    masked_phase = np.ma.masked_where(~valid, phase)
    masked_coherence = np.ma.masked_where(~valid, coherence)
    extent = [
        float(np.min(x_coordinates)),
        float(np.max(x_coordinates)),
        float(np.min(y_coordinates)),
        float(np.max(y_coordinates)),
    ]
    figure, axes = plt.subplots(1, 2, figsize=(14, 6), constrained_layout=True)
    phase_image = axes[0].imshow(
        masked_phase,
        extent=extent,
        origin="upper",
        cmap="viridis",
        aspect="equal",
    )
    axes[0].set_title("Unwrapped phase")
    axes[0].set_xlabel("Projected x (m)")
    axes[0].set_ylabel("Projected y (m)")
    figure.colorbar(phase_image, ax=axes[0], label="radians")

    coherence_image = axes[1].imshow(
        masked_coherence,
        extent=extent,
        origin="upper",
        cmap="magma",
        vmin=0,
        vmax=1,
        aspect="equal",
    )
    axes[1].set_title("Coherence magnitude")
    axes[1].set_xlabel("Projected x (m)")
    axes[1].set_ylabel("Projected y (m)")
    figure.colorbar(coherence_image, ax=axes[1], label="unitless")
    figure.suptitle(f"{title}\n{projection}", fontsize=11)
    figure.savefig(output, dpi=180)
    plt.close(figure)


def process(
    input_path: Path,
    plot_path: Path,
    metadata_path: Path,
    minimum_coherence: float,
) -> dict[str, Any]:
    """Read verified layers, create a preview, and write provenance metadata."""
    with h5py.File(input_path, "r") as handle:
        phase_dataset = handle[PHASE_PATH]
        phase = phase_dataset[()]
        coherence = handle[COHERENCE_PATH][()]
        quality_mask = handle[MASK_PATH][()]
        x_coordinates = handle[X_COORDINATES_PATH][()]
        y_coordinates = handle[Y_COORDINATES_PATH][()]
        projection = handle[PROJECTION_PATH]
        projection_attributes = {
            str(key): decode(value) for key, value in projection.attrs.items()
        }
        valid = build_valid_mask(phase, coherence, quality_mask, minimum_coherence)
        metadata: dict[str, Any] = {
            "source_file": str(input_path),
            "product": {
                "granule_id": scalar(handle, GRANULE_ID_PATH),
                "type": scalar(handle, PRODUCT_TYPE_PATH),
                "level": scalar(handle, PRODUCT_LEVEL_PATH),
                "reference_start": scalar(handle, REFERENCE_START_PATH),
                "secondary_start": scalar(handle, SECONDARY_START_PATH),
                "temporal_baseline_days": scalar(handle, TEMPORAL_BASELINE_PATH),
                "bounding_polygon_wkt": scalar(handle, BOUNDING_POLYGON_PATH),
            },
            "scientific_layer": {
                "path": PHASE_PATH,
                "description": decode(phase_dataset.attrs.get("description")),
                "units": decode(phase_dataset.attrs.get("units")),
                "fill_value": decode(phase_dataset.attrs.get("_FillValue")),
                "shape": list(phase.shape),
            },
            "quality_layer": {
                "phase_path": PHASE_PATH,
                "coherence_path": COHERENCE_PATH,
                "mask_path": MASK_PATH,
                "minimum_coherence": minimum_coherence,
                "mask_fill_value": decode(handle[MASK_PATH].attrs.get("_FillValue")),
                "mask_description": decode(handle[MASK_PATH].attrs.get("description")),
                "rule": (
                    "Exclude non-finite values, fill 255, water flag, zero "
                    "reference/secondary subswath digits, and coherence below "
                    "the configured threshold."
                ),
            },
            "coordinates": {
                "x_path": X_COORDINATES_PATH,
                "y_path": Y_COORDINATES_PATH,
                "x_units": decode(handle[X_COORDINATES_PATH].attrs.get("units")),
                "y_units": decode(handle[Y_COORDINATES_PATH].attrs.get("units")),
                "x_min": float(np.min(x_coordinates)),
                "x_max": float(np.max(x_coordinates)),
                "y_min": float(np.min(y_coordinates)),
                "y_max": float(np.max(y_coordinates)),
                "projection_path": PROJECTION_PATH,
                "projection_attributes": projection_attributes,
            },
            "statistics": phase_statistics(phase, valid),
            "interpretation_boundary": (
                "This output reports unwrapped interferometric phase in radians. "
                "It does not convert phase to displacement or identify a cause."
            ),
            "outputs": {
                "plot": str(plot_path),
                "metadata": str(metadata_path),
            },
        }

    render_preview(
        phase,
        coherence,
        valid,
        x_coordinates,
        y_coordinates,
        plot_path,
        metadata["product"]["granule_id"],
        f"EPSG:{projection_attributes.get('epsg_code', 'unknown')}",
    )
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=None)
    parser.add_argument(
        "--plot",
        type=Path,
        default=Path("docs/screenshots/gunw_scientific_preview.png"),
    )
    parser.add_argument(
        "--metadata",
        type=Path,
        default=Path("data/processed/gunw_processing.json"),
    )
    parser.add_argument("--minimum-coherence", type=float, default=0.3)
    args = parser.parse_args()

    input_path = args.input
    if input_path is None:
        candidates = sorted(Path("data/raw").glob("*.h5"))
        if len(candidates) != 1:
            raise SystemExit("Specify --input when data/raw does not contain exactly one .h5 file.")
        input_path = candidates[0]
    if not input_path.is_file():
        raise SystemExit(f"Input product does not exist: {input_path}")

    metadata = process(input_path, args.plot, args.metadata, args.minimum_coherence)
    statistics = metadata["statistics"]
    print(f"Variable: {PHASE_PATH}")
    print(f"Units: {metadata['scientific_layer']['units']}")
    print(f"Minimum: {statistics['minimum']:.6f}")
    print(f"Maximum: {statistics['maximum']:.6f}")
    print(f"Median: {statistics['median']:.6f}")
    print(f"Valid pixels: {statistics['valid_pixel_count']}")
    print(f"Preview: {args.plot}")
    print(f"Metadata: {args.metadata}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
