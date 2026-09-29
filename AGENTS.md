# TerraCascade build rules

## Scientific boundary

- Never invent NISAR measurements.
- Keep observed, derived, contextual, and potential evidence separate.
- Preserve source metadata, units, coordinates, fill values, and quality masks.
- Do not convert or interpret a variable until its product documentation and
  inventory establish the required parameters.
- The contextual 3D globe may show Earth imagery and navigation context, but it
  is not a NISAR measurement surface.

## Phase order

1. Repository setup
2. Data discovery
3. Scientific visualization
4. Demonstration-region extraction
5. Temporal processing
6. Web assets
7. Frontend skeleton
8. Explorer
9. Time Travel
10. Change DNA
11. Cascade Mode
12. Provenance and methodology
13. Testing and audit

Do not skip a phase gate. When a required input is unknown, stop and
investigate it.

## Frontend

The Next.js app lives in `web/`. It must remain usable when processed data is
absent and must explain the missing-data state instead of rendering placeholders.
