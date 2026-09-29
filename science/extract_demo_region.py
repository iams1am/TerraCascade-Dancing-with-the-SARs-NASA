"""Extract one bounded, georeferenced GUNW demonstration region."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Any

import h5py
import numpy as np

from science.process_gunw import (
    COHERENCE_PATH,
    MASK_PATH,
    PHASE_PATH,
    PROJECTION_PATH,
    X_COORDINATES_PATH,
    Y_COORDINATES_PATH,
    build_valid_mask,
    decode,
    phase_statistics,
)

SOURCE_URL = (
    "https://nisar.asf.earthdatacloud.nasa.gov/NISAR-SAMPLE-DATA/GUNW/"
    "NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_"
    "20081127T061000_20081127T061014_D00404_N_F_J_001/"
    "NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_"
    "20081127T061000_20081127T061014_D00404_N_F_J_001.h5"
)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def polygon_center(wkt: str) -> tuple[float, float]:
    """Return the mean longitude/latitude of a WGS84 polygon's vertices."""
    coordinates = [
        (float(longitude), float(latitude))
        for longitude, latitude in re.findall(
            r"(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)",
            wkt,
        )
    ]
    if not coordinates:
        raise ValueError("bounding polygon contains no coordinate pairs")
    return (
        float(np.mean([latitude for _, latitude in coordinates])),
        float(np.mean([longitude for longitude, _ in coordinates])),
    )


def build_surface_preview(
    phase: np.ndarray,
    coherence: np.ndarray,
    valid: np.ndarray,
    x_coordinates: np.ndarray,
    y_coordinates: np.ndarray,
    rows: int = 42,
    columns: int = 56,
) -> dict[str, Any]:
    """Export a small, source-derived sample for interactive 3D rendering."""
    row_indices = np.linspace(0, phase.shape[0] - 1, rows).astype(int)
    column_indices = np.linspace(0, phase.shape[1] - 1, columns).astype(int)
    phase_values = phase[np.ix_(row_indices, column_indices)]
    coherence_values = coherence[np.ix_(row_indices, column_indices)]
    valid_values = valid[np.ix_(row_indices, column_indices)]
    finite_phase = phase[valid]
    return {
        "rows": rows,
        "columns": columns,
        "x": [float(value) for value in x_coordinates[column_indices]],
        "y": [float(value) for value in y_coordinates[row_indices]],
        "phase": [
            float(value) if is_valid else None
            for value, is_valid in zip(phase_values.ravel(), valid_values.ravel())
        ],
        "coherence": [
            float(value) if is_valid else None
            for value, is_valid in zip(coherence_values.ravel(), valid_values.ravel())
        ],
        "phase_min": float(np.min(finite_phase)),
        "phase_max": float(np.max(finite_phase)),
        "phase_units": "radians",
        "height_semantics": "visual relative phase amplitude, not displacement",
        "source": PHASE_PATH,
        "quality_source": COHERENCE_PATH,
    }


def render_region(
    phase: np.ndarray,
    coherence: np.ndarray,
    valid: np.ndarray,
    extent: list[float],
    output: Path,
    title: str,
) -> None:
    """Render the extracted region with its projected extent."""
    try:
        import matplotlib.pyplot as plt
    except ImportError as error:
        raise RuntimeError("Install matplotlib to render the demonstration region") from error

    output.parent.mkdir(parents=True, exist_ok=True)
    figure, axes = plt.subplots(1, 2, figsize=(13, 5.5), constrained_layout=True)
    masked_phase = np.ma.masked_where(~valid, phase)
    masked_coherence = np.ma.masked_where(~valid, coherence)
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
    figure.suptitle(title, fontsize=11)
    figure.savefig(output, dpi=180)
    plt.close(figure)


def render_phase_overlay(
    phase: np.ndarray,
    valid: np.ndarray,
    output: Path,
) -> None:
    """Render a transparent phase-only image for geographic overlay use."""
    try:
        import matplotlib.pyplot as plt
        from matplotlib.colors import Normalize
    except ImportError as error:
        raise RuntimeError("Install matplotlib to render the phase overlay") from error

    finite_phase = phase[valid]
    normalized = Normalize(
        vmin=float(np.min(finite_phase)),
        vmax=float(np.max(finite_phase)),
    )(phase)
    rgba = plt.get_cmap("viridis")(np.nan_to_num(normalized, nan=0.0))
    rgba[..., 3] = valid.astype(float) * 0.82
    output.parent.mkdir(parents=True, exist_ok=True)
    plt.imsave(output, rgba)


def extract(
    input_path: Path,
    output_dir: Path,
    web_data_dir: Path,
    x_min: float,
    x_max: float,
    y_min: float,
    y_max: float,
    minimum_coherence: float,
) -> dict[str, Any]:
    """Extract, render, and export one bounded region from the verified layer."""
    if x_min >= x_max or y_min >= y_max:
        raise ValueError("AOI minimum coordinates must be less than maximum coordinates")

    with h5py.File(input_path, "r") as handle:
        phase = handle[PHASE_PATH][()]
        coherence = handle[COHERENCE_PATH][()]
        quality_mask = handle[MASK_PATH][()]
        x_coordinates = handle[X_COORDINATES_PATH][()]
        y_coordinates = handle[Y_COORDINATES_PATH][()]
        projection = handle[PROJECTION_PATH]
        projection_attributes = {
            str(key): decode(value) for key, value in projection.attrs.items()
        }
        x_indices = np.where((x_coordinates >= x_min) & (x_coordinates <= x_max))[0]
        y_indices = np.where((y_coordinates >= y_min) & (y_coordinates <= y_max))[0]
        if x_indices.size == 0 or y_indices.size == 0:
            raise ValueError("AOI does not intersect the source grid")

        row_start, row_end = int(y_indices.min()), int(y_indices.max()) + 1
        col_start, col_end = int(x_indices.min()), int(x_indices.max()) + 1
        phase_region = phase[row_start:row_end, col_start:col_end]
        coherence_region = coherence[row_start:row_end, col_start:col_end]
        mask_region = quality_mask[row_start:row_end, col_start:col_end]
        x_region = x_coordinates[col_start:col_end]
        y_region = y_coordinates[row_start:row_end]
        valid = build_valid_mask(
            phase_region,
            coherence_region,
            mask_region,
            minimum_coherence,
        )
        statistics = phase_statistics(phase_region, valid)
        valid_ratio = float(valid.sum() / valid.size)
        coherence_values = coherence_region[valid]
        coherence_statistics = {
            "valid_pixel_count": int(coherence_values.size),
            "minimum": float(np.min(coherence_values)),
            "maximum": float(np.max(coherence_values)),
            "median": float(np.median(coherence_values)),
            "mean": float(np.mean(coherence_values)),
        }
        product = {
            "granule_id": decode(handle["science/LSAR/identification/granuleId"][()]),
            "product_type": decode(handle["science/LSAR/identification/productType"][()]),
            "product_level": decode(handle["science/LSAR/identification/productLevel"][()]),
            "reference_start": decode(
                handle["science/LSAR/identification/referenceZeroDopplerStartTime"][()]
            ),
            "secondary_start": decode(
                handle["science/LSAR/identification/secondaryZeroDopplerStartTime"][()]
            ),
            "temporal_baseline_days": decode(
                handle["science/LSAR/GUNW/metadata/orbit/temporalBaseline"][()]
            ),
            "bounding_polygon_wkt": decode(
                handle["science/LSAR/identification/boundingPolygon"][()]
            ),
        }
        center_latitude, center_longitude = polygon_center(
            product["bounding_polygon_wkt"]
        )

    extent = [
        float(np.min(x_region)),
        float(np.max(x_region)),
        float(np.min(y_region)),
        float(np.max(y_region)),
    ]
    layer_path = output_dir / "layer.png"
    render_region(
        phase_region,
        coherence_region,
        valid,
        extent,
        layer_path,
        f"TerraCascade demonstration region · EPSG:{projection_attributes.get('epsg_code')}",
    )

    source_metadata = {
        "source_file": str(input_path),
        "source_url": SOURCE_URL,
        "download_date": "2026-09-29",
        "mission": "NASA-ISRO NISAR",
        "product": product,
        "scientific_layer": {
            "path": PHASE_PATH,
            "units": "radians",
            "meaning": "Unwrapped interferometric phase between HH layers",
        },
        "quality": {
            "coherence_path": COHERENCE_PATH,
            "mask_path": MASK_PATH,
            "minimum_coherence": minimum_coherence,
            "valid_pixel_ratio": valid_ratio,
            "coherence_statistics": coherence_statistics,
        },
        "coordinates": {
            "projection": f"EPSG:{projection_attributes.get('epsg_code')}",
            "center_latitude": center_latitude,
            "center_longitude": center_longitude,
            "x_units": "meters",
            "y_units": "meters",
            "bounds": extent,
            "source_x_path": X_COORDINATES_PATH,
            "source_y_path": Y_COORDINATES_PATH,
        },
        "statistics": statistics,
        "limitations": [
            "This is a NASA/ASF sample product with historical surrogate-era acquisition dates.",
            "The displayed scientific layer is unwrapped phase in radians, not converted displacement.",
            "One interferogram pair is available; a persistent multi-observation time series is not established.",
            "Radar phase alone does not establish a deformation cause or predict a disaster.",
        ],
    }
    write_json(output_dir / "bounds.json", {
        "projection": f"EPSG:{projection_attributes.get('epsg_code')}",
        "center_latitude": center_latitude,
        "center_longitude": center_longitude,
        "x_min": extent[0],
        "y_min": extent[2],
        "x_max": extent[1],
        "y_max": extent[3],
    })
    write_json(output_dir / "statistics.json", {
        "phase": statistics,
        "coherence": coherence_statistics,
        "valid_pixel_ratio": valid_ratio,
        "phase_units": "radians",
        "coherence_units": "1",
    })
    write_json(output_dir / "metadata.json", source_metadata)

    web_data_dir.mkdir(parents=True, exist_ok=True)
    web_imagery_dir = web_data_dir / "imagery"
    web_imagery_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(layer_path, web_imagery_dir / "demo-region.png")
    phase_overlay_path = web_imagery_dir / "phase-overlay.png"
    render_phase_overlay(phase_region, valid, phase_overlay_path)
    write_json(web_data_dir / "surface.json", build_surface_preview(
        phase_region,
        coherence_region,
        valid,
        x_region,
        y_region,
    ))
    try:
        from pyproj import Transformer
    except ImportError as error:
        raise RuntimeError("Install pyproj to export geographic AOI bounds") from error
    transformer = Transformer.from_crs(
        f"EPSG:{projection_attributes.get('epsg_code')}",
        "EPSG:4326",
        always_xy=True,
    )
    geographic_corners = [
        transformer.transform(extent[0], extent[2]),
        transformer.transform(extent[1], extent[2]),
        transformer.transform(extent[1], extent[3]),
        transformer.transform(extent[0], extent[3]),
        transformer.transform(extent[0], extent[2]),
    ]
    write_json(web_data_dir / "footprint.geojson", {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "event_id": "TC001",
                "evidence_level": "DERIVED",
                "projection": f"EPSG:{projection_attributes.get('epsg_code')}",
                "source": "AOI bounds transformed from projected GUNW coordinates",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [float(longitude), float(latitude)]
                    for longitude, latitude in geographic_corners
                ]],
            },
        }],
    })
    geographic_longitudes = [corner[0] for corner in geographic_corners]
    geographic_latitudes = [corner[1] for corner in geographic_corners]
    geographic_bounds = {
        "south": float(min(geographic_latitudes)),
        "west": float(min(geographic_longitudes)),
        "north": float(max(geographic_latitudes)),
        "east": float(max(geographic_longitudes)),
    }
    context_padding_latitude = max(
        (geographic_bounds["north"] - geographic_bounds["south"]) * 1.8,
        0.35,
    )
    context_padding_longitude = max(
        (geographic_bounds["east"] - geographic_bounds["west"]) * 1.8,
        2.1,
    )
    context_bounds = {
        "south": geographic_bounds["south"] - context_padding_latitude,
        "west": geographic_bounds["west"] - context_padding_longitude,
        "north": geographic_bounds["north"] + context_padding_latitude,
        "east": geographic_bounds["east"] + context_padding_longitude,
    }
    event = {
        "id": "TC001",
        "title": "Southern California phase demonstration",
        "location": "Southern California, United States",
        "type": "ground_deformation",
        "summary": "A verified GUNW interferometric-phase demonstration region.",
        "evidence_level": "OBSERVED",
        "source_product": product["granule_id"],
        "source_url": SOURCE_URL,
        "projection": f"EPSG:{projection_attributes.get('epsg_code')}",
        "bounds": {
            "x_min": extent[0],
            "y_min": extent[2],
            "x_max": extent[1],
            "y_max": extent[3],
        },
        "center": {
            "latitude": center_latitude,
            "longitude": center_longitude,
        },
        "geographic_bounds": geographic_bounds,
        "context_bounds": context_bounds,
        "imagery": "/data/imagery/demo-region.png",
        "map_overlay": "/data/imagery/phase-overlay.png",
        "map_overlay_units": "radians",
        "sources": ["NASA/ASF NISAR sample GUNW product"],
    }
    observations = {
        "event_id": "TC001",
        "measurement": {
            "name": "Unwrapped interferometric phase",
            "units": "radians",
            "value_source": "statistics.median",
            "statistics": statistics,
        },
        "quality": {
            "coherence": coherence_statistics,
            "valid_pixel_ratio": valid_ratio,
            "threshold": minimum_coherence,
        },
        "observation_pair": {
            "reference": product["reference_start"],
            "secondary": product["secondary_start"],
            "temporal_baseline_days": product["temporal_baseline_days"],
        },
        "imagery": "/data/imagery/demo-region.png",
        "evidence_level": "OBSERVED",
        "limitations": source_metadata["limitations"],
    }
    provenance = {
        "mission": "NASA-ISRO NISAR",
        "product": product["product_type"],
        "processing_level": product["product_level"],
        "observation": {
            "reference": product["reference_start"],
            "secondary": product["secondary_start"],
            "temporal_baseline_days": product["temporal_baseline_days"],
        },
        "source_product": product["granule_id"],
        "source_url": SOURCE_URL,
        "download_date": "2026-09-29",
        "processing": [
            f"Read {PHASE_PATH}.",
            f"Applied {MASK_PATH} and {COHERENCE_PATH}.",
            f"Excluded non-finite values, fill 255, water, invalid subswaths, and coherence below {minimum_coherence}.",
            "Exported a bounded EPSG:32611 static preview.",
        ],
        "units": {
            "measurement": "radians",
            "coordinates": "meters in EPSG:32611",
            "coherence": "unitless",
        },
        "limitations": source_metadata["limitations"],
    }
    timeseries = {
        "event_id": "TC001",
        "status": "single_interferogram_pair",
        "observations": [
            {
                "id": "reference",
                "date": product["reference_start"],
                "role": "reference_acquisition",
            },
            {
                "id": "secondary",
                "date": product["secondary_start"],
                "role": "secondary_acquisition",
            },
        ],
        "message": "Two acquisitions define this interferogram pair; a persistent multi-pair time series is not claimed.",
    }
    change_dna = {
        "event_id": "TC001",
        "indicators": [
            {
                "name": "Data quality coverage",
                "value": valid_ratio,
                "display_percent": round(valid_ratio * 100, 1),
                "units": "fraction of pixels",
                "evidence_level": "DERIVED",
                "calculation": "Valid pixels after the documented mask and coherence threshold divided by AOI pixels.",
                "source": "GUNW mask and coherenceMagnitude",
            },
            {
                "name": "Coherence",
                "value": coherence_statistics["median"],
                "display_percent": round(coherence_statistics["median"] * 100, 1),
                "units": "unitless",
                "evidence_level": "OBSERVED",
                "calculation": "Median coherenceMagnitude over pixels passing the quality mask.",
                "source": COHERENCE_PATH,
            },
            {
                "name": "Temporal separation",
                "value": product["temporal_baseline_days"],
                "display_percent": None,
                "units": "days",
                "evidence_level": "OBSERVED",
                "calculation": "Product temporal baseline between reference and secondary acquisitions.",
                "source": "science/LSAR/GUNW/metadata/orbit/temporalBaseline",
            },
        ],
        "omitted": [
            "Displacement magnitude: no documented conversion was applied from phase radians.",
            "Persistence: one interferogram pair is insufficient for a persistent time series.",
        ],
    }
    cascade = {
        "event_id": "TC001",
        "nodes": [
            {
                "id": "observation",
                "label": "Interferometric phase observed",
                "evidence": "OBSERVED",
                "explanation": "The verified GUNW product contains an unwrapped phase layer in radians.",
                "source": PHASE_PATH,
                "limitation": "Phase is not displayed as displacement.",
            },
            {
                "id": "quality",
                "label": "Quality-screened pixels retained",
                "evidence": "DERIVED",
                "explanation": "The product mask and coherence threshold select pixels for the preview.",
                "source": f"{MASK_PATH}; {COHERENCE_PATH}",
                "limitation": "A threshold does not remove every source of uncertainty.",
            },
            {
                "id": "context",
                "label": "Southern California context",
                "evidence": "CONTEXTUAL",
                "explanation": "The geocoded footprint is located in Southern California.",
                "source": "GUNW boundingPolygon and EPSG:32611 geocoding",
                "limitation": "Context does not establish a deformation cause.",
            },
            {
                "id": "next-step",
                "label": "Further investigation may be warranted",
                "evidence": "POTENTIAL",
                "explanation": "Additional compatible interferograms and ground context would be needed to assess persistence.",
                "source": "TerraCascade limitation policy",
                "limitation": "This is not a prediction, diagnosis, or hazard alert.",
            },
        ],
        "edges": [
            {"source": "observation", "target": "quality"},
            {"source": "quality", "target": "context"},
            {"source": "context", "target": "next-step"},
        ],
    }
    write_json(web_data_dir / "event.json", event)
    write_json(web_data_dir / "observations.json", observations)
    write_json(web_data_dir / "timeseries.json", timeseries)
    write_json(web_data_dir / "change-dna.json", change_dna)
    write_json(web_data_dir / "cascade.json", cascade)
    write_json(web_data_dir / "provenance.json", provenance)
    write_json(web_data_dir / "status.json", {
        "project": "TerraCascade",
        "phase": 11,
        "status": "processed_demo_available",
        "measurementLayer": PHASE_PATH,
        "sourceProduct": product["granule_id"],
        "message": "A verified GUNW demonstration region is available.",
        "evidencePolicy": ["OBSERVED", "DERIVED", "CONTEXTUAL", "POTENTIAL"],
    })
    return source_metadata


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=None)
    parser.add_argument("--output-dir", type=Path, default=Path("data/processed/demo_region"))
    parser.add_argument("--web-data-dir", type=Path, default=Path("web/public/data"))
    parser.add_argument("--x-min", type=float, default=395000)
    parser.add_argument("--x-max", type=float, default=430000)
    parser.add_argument("--y-min", type=float, default=3830000)
    parser.add_argument("--y-max", type=float, default=3875000)
    parser.add_argument("--minimum-coherence", type=float, default=0.3)
    args = parser.parse_args()

    input_path = args.input
    if input_path is None:
        candidates = sorted(Path("data/raw").glob("*.h5"))
        if len(candidates) != 1:
            raise SystemExit("Specify --input when data/raw does not contain exactly one .h5 file.")
        input_path = candidates[0]
    metadata = extract(
        input_path,
        args.output_dir,
        args.web_data_dir,
        args.x_min,
        args.x_max,
        args.y_min,
        args.y_max,
        args.minimum_coherence,
    )
    print(f"Region: {metadata['coordinates']['bounds']}")
    print(f"Projection: {metadata['coordinates']['projection']}")
    print(f"Valid pixels: {metadata['statistics']['valid_pixel_count']}")
    print(f"Layer: {args.output_dir / 'layer.png'}")
    print(f"Web assets: {args.web_data_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
