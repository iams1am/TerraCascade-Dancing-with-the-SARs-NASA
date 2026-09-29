# TerraCascade architecture

```text
NISAR HDF5
    ↓
science/inspect_nisar.py
    ↓
verified scientific layer
    ↓
Python preprocessing
    ↓
small JSON + PNG + GeoJSON + sampled scientific surface assets
    ↓
web/ Next.js application
```

The geographic workbench uses a self-contained pointer/zoom surface with a
high-resolution NASA GIBS flat map. Its image preserves the contextual
geographic aspect ratio, and the source-derived AOI frame and locator are
positioned in the same rendered image coordinate system. The interactive SAR
surface renders only downsampled values from the verified GUNW phase and
coherence arrays; its vertical dimension is visual encoding, not displacement.
The scientific phase preview remains a separate bounded layer rather than a
projection onto an unrelated geographic surface.
Zooming out continuously blends to a separate full-world NASA GIBS overview,
because a single Southern California WMS request cannot reveal geography
outside its requested bounds. Pointer panning works across both layers, and
click selection is a contextual navigation aid that does not alter the
verified observation record. The map captures non-passive wheel input and
clamps panning to the active imagery coverage so browser page scrolling and
blank gutters do not interrupt map interaction.

The 3D Earth scene remains a presentation and navigation layer. It is not used
to generate, estimate, or imply a scientific measurement. The current product
contains one real demonstration location and one interferogram pair, so the
map is spatially explorable but the scientific layer is not replicated across
unverified locations.
