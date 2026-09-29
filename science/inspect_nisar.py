"""Inventory supported NISAR files without calculating measurements."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SUPPORTED_SUFFIXES = {".h5", ".hdf5", ".nc", ".nc4", ".tif", ".tiff"}
RELEVANT_TERMS = (
    "unwrapped",
    "displacement",
    "phase",
    "coherence",
    "quality",
    "mask",
    "latitude",
    "longitude",
    "coordinate",
    "geolocation",
)


def json_value(value: Any) -> Any:
    """Convert common scientific metadata values into JSON-safe values."""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if hasattr(value, "tolist"):
        return json_value(value.tolist())
    if hasattr(value, "item"):
        return json_value(value.item())
    if isinstance(value, (list, tuple)):
        return [json_value(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def candidate(path: str) -> bool:
    """Mark dataset paths that require human scientific review."""
    lowered = path.lower()
    return any(term in lowered for term in RELEVANT_TERMS)


def inspect_hdf5(path: Path) -> dict[str, Any]:
    """Enumerate HDF5 groups, datasets, shapes, dtypes, and attributes."""
    try:
        import h5py
    except ImportError as error:
        raise RuntimeError("Install h5py before inspecting HDF5 products.") from error

    groups: list[str] = []
    datasets: list[dict[str, Any]] = []
    with h5py.File(path, "r") as handle:
        root_attributes = {
            str(key): json_value(value) for key, value in handle.attrs.items()
        }

        def visit(name: str, item: Any) -> None:
            if isinstance(item, h5py.Group):
                groups.append(name)
            elif isinstance(item, h5py.Dataset):
                datasets.append(
                    {
                        "path": name,
                        "shape": list(item.shape),
                        "dtype": str(item.dtype),
                        "attributes": {
                            str(key): json_value(value)
                            for key, value in item.attrs.items()
                        },
                        "candidate": candidate(name),
                    }
                )

        handle.visititems(visit)
    return {
        "file_type": "HDF5",
        "root_attributes": root_attributes,
        "groups": groups,
        "datasets": datasets,
    }


def inspect_file(path: Path) -> dict[str, Any]:
    """Inspect one supported file, failing clearly for unsupported formats."""
    if path.suffix.lower() in {".h5", ".hdf5", ".nc", ".nc4"}:
        return inspect_hdf5(path)
    raise RuntimeError(
        "Only HDF5/NISAR products are enabled in the initial Phase 1 scaffold."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("docs/methodology/nisar_inventory.json"),
    )
    args = parser.parse_args()
    files = sorted(
        path
        for path in args.raw_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )
    if not files:
        print(f"No supported NISAR products found under {args.raw_dir}.")
        print("Phase 1 remains blocked until a source product is provided.")
        return 2

    inventory = []
    for path in files:
        try:
            inventory.append(
                {"filename": str(path), "inventory": inspect_file(path)}
            )
        except (OSError, RuntimeError) as error:
            print(f"ERROR: {path}: {error}", file=sys.stderr)
            return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print(f"Inspected {len(files)} product(s). Report: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
