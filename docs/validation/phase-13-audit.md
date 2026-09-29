# Phase 13 validation audit

## Result

| Area | Result | Evidence |
|---|---|---|
| Scientific measurements | PASS | Frontend values are loaded from generated assets; no legacy illustrative values remain in `web/app` or `web/components`. |
| Source metadata | PASS | `web/public/data/provenance.json` contains mission, product, dates, source URL, processing, units, and limitations. |
| Units | PASS | The displayed phase remains in radians; projected coordinates are recorded as metres in EPSG:32611. |
| Observation dates | PASS | `temporal-validation.json` records ordered 2008-10-12 and 2008-11-27 acquisitions with a 46-day baseline. |
| Invalid values | PASS | The Python mask excludes non-finite values, fill 255, water, invalid subswaths, and coherence below 0.3. |
| Calculation tests | PASS | Scientific, temporal, provenance, and repository audit tests pass. |
| Frontend routes | PASS | `/`, `/explore`, `/methodology`, and `/about` build as static routes. |
| 3D globe | PASS | Three.js Earth supports rotation, zoom, pause, reset, and source-derived contextual locator. |
| Scientific overlay | PASS | Explorer loads the generated filtered phase/coherence image and real static JSON assets. |
| Geographic map | PASS | The self-contained flat map loads high-resolution NASA GIBS Blue Marble imagery, preserves its geographic aspect ratio, captures wheel zoom without page scrolling, clamps drag/zoom to loaded imagery, blends to a full-world overview when zoomed out, and supports contextual click-to-select coordinates without changing the source record. |
| Scientific map overlay | PASS | The processed phase/coherence preview is available as a source-bounded image overlay with layer visibility and opacity controls. |
| Client-side route teardown | PASS | The geographic workbench has no third-party map lifecycle or route teardown dependency. |
| 3D SAR surface | PASS | A downsampled source-derived phase/coherence surface is interactive and labels visual height as non-displacement. |
| Methodology/About interaction | PASS | Both pages render the interactive 3D evidence orbit with selectable evidence classes. |
| Timeline | PASS | Reference and secondary acquisitions are rendered from `observations.json` and temporal validation. |
| Change DNA | PASS | Indicators are individually sourced; no opaque combined score is used. |
| Cascade Mode | PASS | Nodes expose evidence class, explanation, source, and limitation. |
| Provenance UI | PASS | Explorer displays source product, source link, units, processing, and limitations. |
| Responsive layout | PASS | CSS provides 900px and 600px layout breakpoints for the globe, scientific panels, timeline, DNA, and provenance. |
| Secrets/API keys | PASS | No API keys or secrets are required by the current static application. |
| Raw data protection | PASS | `data/raw/*` and `data/processed/*` are ignored; only small derived browser assets are exported. |
| Generated artifacts | PASS | `*.tsbuildinfo` and npm debug logs are ignored. |
| Python reproducibility | PASS | Scientific processing dependencies are pinned in `requirements.txt`. |
| Dependency advisories | ACTION REQUIRED | `npm audit --omit=dev` reports remaining transitive PostCSS advisories in Next 15; resolving them requires a breaking Next 16 upgrade. |
| Production build | PASS | `npm run lint`, `npm run typecheck`, and `npm run build` pass. |

## Known limitations

- The current demo uses one historical NASA/ASF sample GUNW interferogram pair.
- The measurement is unwrapped phase in radians, not converted displacement.
- One pair does not establish persistent deformation.
- The 3D Earth is contextual presentation, not a NISAR surface model.
- The geographic workbench uses a self-contained NASA GIBS flat map; the
  scientific raster remains a bounded phase preview rather than a global
  measurement layer.
- The current Next.js 15 production dependency set has remaining transitive
  PostCSS advisories. The application does not use middleware, rewrites,
  Server Actions, or remote image optimization, but the dependency should be
  reassessed before public deployment.
