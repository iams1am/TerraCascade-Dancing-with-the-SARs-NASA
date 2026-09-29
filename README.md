# TerraCascade

> A radar-data explorer for the NASA Space Apps Challenge 2026  
> **Challenge:** Dancing with the SARs

TerraCascade is an interactive web project for exploring a documented
NASA/ASF NISAR sample product. It brings the radar image, quality information,
acquisition dates, map context, processing steps, and source links into one
place.

The project is designed for people who may not work with synthetic aperture
radar every day. It aims to make the data easier to inspect without hiding the
scientific details or suggesting conclusions that the current sample cannot
support.

## Website Live on:

[https://terra-cascade-dancing-with-the-sa-r.vercel.app/ .

[Run the web app](#quick-start) ·
[Review the methodology](docs/methodology/README.md) ·
[Read the validation audit](docs/validation/phase-13-audit.md)

---

## Project summary

Radar products can be difficult to understand outside a specialist workflow.
A useful interface needs to answer more than “what does the image look like?”
It should also answer:

- Which product and variable are being shown?
- What units are used?
- Which pixels passed the quality checks?
- When were the source acquisitions collected?
- Which values come directly from the product?
- Which values were calculated by this project?
- What can this sample support, and what still needs more evidence?

TerraCascade addresses those questions with a reproducible Python processing
pipeline and a Next.js interface built from small, browser-ready assets.

### What the current demo includes

- A bounded Southern California demonstration region.
- Unwrapped interferometric phase in radians.
- Coherence magnitude and quality-screening information.
- Reference and secondary acquisition dates.
- A NASA GIBS map for geographic context.
- A contextual 3D Earth view.
- A 3D view of sampled phase and coherence values.
- Separate observed, derived, contextual, and potential evidence labels.
- Product provenance, processing steps, units, and limitations.
- Downloadable JSON and GeoJSON files used by the website.

### Important scientific boundary

The current browser experience shows **unwrapped interferometric phase in
radians** from one historical NASA/ASF sample GUNW product.

It does **not**:

- convert phase to displacement;
- present radians as millimetres;
- establish a persistent time series from one interferogram pair;
- identify the physical cause of a signal;
- predict infrastructure damage, flooding, or another hazard;
- present the 3D globe or NASA basemap as a NISAR measurement.

Additional compatible products, documented conversion parameters, temporal
analysis, and independent context are required before making stronger
deformation claims.

---

## Demo at a glance

| Item | Current implementation |
| --- | --- |
| Source | Official NASA/ASF sample GUNW product |
| Product type | Level 2 Geocoded Unwrapped Interferogram |
| Demonstration area | Southern California |
| Measurement shown | Unwrapped phase |
| Measurement unit | Radians |
| Quality layer | Coherence magnitude |
| Quality threshold | Coherence ≥ 0.3 |
| Coordinate reference system | EPSG:32611 |
| Reference acquisition | 2008-10-12 |
| Secondary acquisition | 2008-11-27 |
| Temporal baseline | 46 days |
| Valid sample pixels | Approximately 200,656 |
| Valid-pixel coverage | Approximately 81.5% |
| Frontend | Next.js, React, TypeScript, Three.js |
| Processing | Python, h5py, NumPy, Matplotlib, pyproj |

The dates above belong to a historical sample product. They are not presented
as current operational NISAR observations.

---

## Source product

The demonstration uses this NASA/ASF sample:

```text
NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001.h5
```

[Open the NASA/ASF sample product](https://nisar.asf.earthdatacloud.nasa.gov/NISAR-SAMPLE-DATA/GUNW/NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001/NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001.h5)

The raw HDF5 product is not stored in Git. Its source, filename, dates,
maturity, and handling notes are recorded in [data/README.md](data/README.md).

### HDF5 fields used

The processing pipeline reads these documented product paths:

```text
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/unwrappedPhase
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/coherenceMagnitude
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/mask
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/xCoordinates
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/yCoordinates
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/projection
```

The current region uses the following projected bounds:

```text
x: 395040–430000 m
y: 3830060–3874940 m
```

### Quality rule

A pixel is retained only when:

1. Phase and coherence values are finite.
2. The product mask is not the fill value `255`.
3. The water flag is clear.
4. Reference and secondary subswath digits are non-zero.
5. Coherence is at least `0.3`.

The threshold and mask logic apply to this demonstration. They should not be
treated as universal settings for every radar product.

---

## How TerraCascade works

```text
NASA/ASF sample GUNW product
              |
              v
science/inspect_nisar.py
  inventories groups, variables, attributes, units, and shapes
              |
              v
science/process_gunw.py
  reads verified paths and creates a scientific preview
              |
              v
science/validate_temporal_pair.py
  checks acquisition order and temporal separation
              |
              v
science/extract_demo_region.py
  crops the region, applies quality rules, and exports web assets
              |
              v
web/public/data/
  JSON, GeoJSON, PNG imagery, and sampled 3D surface values
              |
              v
web/
  Next.js interface for exploration and provenance
```

The web application does not read the large HDF5 product directly. It loads
small static files generated by the scientific pipeline. This keeps the demo
fast, deployable, and easy to audit.

---

## Website tour

### Home

The home page introduces the project, explains the four evidence labels, and
shows a short summary of the current sample.

### Explorer

The Explorer contains:

- the NASA GIBS context map;
- the bounded radar overlay;
- the phase and coherence preview;
- sample statistics and acquisition dates;
- a 3D phase/coherence view;
- separately sourced summary indicators;
- an evidence graph;
- product provenance and downloadable project assets.

### Methodology

The Methodology page explains SAR, NISAR, GUNW, the variables used, the
quality screen, the temporal pair, evidence labels, and current limitations.

### About

The About page explains the project goal, the challenge context, the current
scope, and what data is needed next.

---

## Repository structure

```text
.
├── data/
│   ├── raw/                    # local source products; excluded from Git
│   ├── intermediate/           # temporary processing files
│   ├── processed/              # generated scientific outputs
│   └── README.md               # data source and handling notes
├── docs/
│   ├── architecture.md
│   ├── methodology/
│   │   ├── README.md
│   │   ├── nisar_inventory.json
│   │   └── processing.md
│   ├── screenshots/
│   └── validation/
├── science/
│   ├── inspect_nisar.py
│   ├── process_gunw.py
│   ├── extract_demo_region.py
│   └── validate_temporal_pair.py
├── tests/
│   ├── test_extract_demo_region.py
│   ├── test_phase1_state.py
│   ├── test_process_gunw.py
│   ├── test_repository_audit.py
│   └── test_temporal_pair.py
├── web/
│   ├── app/                    # Next.js routes and global styles
│   ├── components/             # map, globe, 3D, and data components
│   └── public/data/            # browser-ready generated assets
├── AGENTS.md                   # repository science and build rules
├── Guide.txt                   # project brief and phase plan
├── requirements.txt            # pinned Python packages
└── README.md
```

---

## Quick start

The generated browser assets are already included. You can run the website
without downloading the raw HDF5 product.

### Requirements

- Node.js and npm
- A modern browser
- WebGL support for the 3D views

### Install and run

From the repository root:

```powershell
Set-Location .\web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available routes

| Route | Description |
| --- | --- |
| `/` | Project introduction and sample summary |
| `/explore` | Map, radar imagery, dates, indicators, and provenance |
| `/methodology` | Processing method, evidence labels, and limitations |
| `/about` | Project goal, challenge, scope, and next steps |

### Production build

```powershell
Set-Location .\web
npm run lint
npm run typecheck
npm run build
npm run start
```

Do not run `next dev` and `next build` against the same `.next` directory at
the same time.

---

## Reproduce the scientific workflow

You only need these steps when inspecting the source product or regenerating
the browser assets.

### 1. Create a Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Pinned packages:

```text
h5py==3.16.0
matplotlib==3.11.2
numpy==2.2.3
pyproj==3.7.1
```

### 2. Add the source product

Place the documented `.h5` or `.hdf5` file in:

```text
data/raw/
```

Raw products are excluded from Git. Update [data/README.md](data/README.md)
with the filename, source URL, product type, dates, coverage, download date,
license information, and limitations.

### 3. Inventory the HDF5 file

```powershell
python science\inspect_nisar.py
```

Output:

```text
docs/methodology/nisar_inventory.json
```

The inventory records the product structure and candidate variables. Review
the product documentation before deciding how any variable should be used.

### 4. Create the scientific preview

```powershell
python science\process_gunw.py `
  --input data\raw\YOUR_PRODUCT.h5 `
  --minimum-coherence 0.3
```

Default outputs:

```text
docs/screenshots/gunw_scientific_preview.png
data/processed/gunw_processing.json
```

The processing record includes source paths, units, fill values, quality
rules, statistics, product identification, and interpretation limits.

### 5. Validate the acquisition pair

```powershell
python science\validate_temporal_pair.py `
  --input data\raw\YOUR_PRODUCT.h5
```

Outputs:

```text
data/processed/demo_region/temporal_validation.json
web/public/data/temporal-validation.json
```

This step checks date ordering and the positive temporal baseline. It does not
turn the pair into a multi-date time series.

### 6. Extract the demonstration region

```powershell
python -m science.extract_demo_region `
  --input data\raw\YOUR_PRODUCT.h5 `
  --x-min 395040 `
  --x-max 430000 `
  --y-min 3830060 `
  --y-max 3874940 `
  --minimum-coherence 0.3
```

This command:

- crops the verified projected arrays;
- applies finite-value, fill, water, subswath, and coherence checks;
- calculates phase and coherence summaries;
- renders the scientific preview and transparent map overlay;
- converts the region footprint to geographic coordinates;
- downsamples values for the 3D view;
- writes the website JSON, GeoJSON, and imagery assets.

Generated scientific assets should be changed through the pipeline, not by
editing the output files by hand.

---

## Browser data files

| File | Purpose |
| --- | --- |
| `event.json` | Product identity, region, projection, bounds, and imagery paths |
| `observations.json` | Phase statistics, quality information, dates, and limitations |
| `timeseries.json` | Reference and secondary acquisition roles |
| `temporal-validation.json` | Acquisition-order and baseline validation |
| `surface.json` | Downsampled phase and coherence values for the 3D view |
| `change-dna.json` | Separately sourced sample indicators |
| `cascade.json` | Evidence steps and their limitations |
| `provenance.json` | Source, units, dates, processing steps, and limitations |
| `footprint.geojson` | Geographic outline of the selected region |
| `status.json` | Current prepared-record status |
| `imagery/demo-region.png` | Phase and coherence preview |
| `imagery/phase-overlay.png` | Transparent radar overlay for the map |

If these files are missing or unavailable, the frontend shows a loading or
error message. It does not insert placeholder measurements.

---

## Evidence labels

TerraCascade uses four labels consistently:

| Label | Meaning | Example |
| --- | --- | --- |
| **Observed** | Read directly from the documented product | Unwrapped phase in radians |
| **Derived** | Calculated from source values with a stated method | Valid-pixel coverage |
| **Contextual** | Added to help locate or understand the sample | NASA GIBS basemap |
| **Potential** | A question that requires more evidence | Whether a signal persists across more acquisitions |

These labels prevent a map, visual effect, or research question from being
mistaken for a satellite measurement.

---

## Interaction notes

### Map

- Drag to pan.
- Scroll or use the zoom buttons to zoom.
- Use arrow keys to pan when the map has keyboard focus.
- Press Home to reset the view.
- Toggle the radar overlay and adjust its opacity.
- Click the map to read a contextual coordinate.

The NASA GIBS imagery is used only as geographic context. The radar overlay
remains inside the source-derived sample footprint.

### 3D Earth

The globe helps users locate the demonstration region. Its Earth texture,
lighting, and animation are contextual and do not represent a NISAR
measurement.

### 3D radar view

The point surface uses downsampled phase or coherence values. Height is a
visual aid for inspecting patterns; it is not terrain or displacement.

---

## Validation

Run the project checks from the repository root:

```powershell
python -m unittest discover -s tests -v

Set-Location .\web
npm run lint
npm run typecheck
npm run build
```

The tests cover:

- product-path and metadata handling;
- mask and coherence logic;
- demonstration-region extraction;
- temporal-pair validation;
- generated asset contracts;
- repository safeguards for raw data and unsupported claims.

The latest detailed audit is stored in
[docs/validation/phase-13-audit.md](docs/validation/phase-13-audit.md).

---

## Current limitations

- The demo uses one historical sample GUNW product.
- One interferogram pair cannot establish persistence.
- No phase-to-displacement conversion is applied.
- No causal attribution is made.
- The map and globe provide context only.
- The interface is a research demonstration, not an operational monitoring or
  alert system.

These limits are part of the product design and should remain visible in
future versions.

---

## Roadmap

Future work should follow the available evidence:

1. Identify additional compatible products.
2. Verify matching coverage, polarization, units, and processing assumptions.
3. Add documented displacement conversion only when all required parameters
   are available.
4. Build multi-pair temporal analysis.
5. Validate patterns against independent contextual sources.
6. Extend the interface only after the corresponding science is ready.

---

## Contributing

When contributing:

1. Keep source metadata, units, coordinates, fill values, and quality masks.
2. Do not commit raw Earth-observation products.
3. Do not invent measurements for demos or screenshots.
4. Keep observed, derived, contextual, and potential evidence separate.
5. Update the processing code before regenerating scientific assets.
6. Run the Python and frontend checks before opening a pull request.

Repository-specific build and science rules are documented in
[AGENTS.md](AGENTS.md).

---

## Acknowledgements

TerraCascade was prepared for the **NASA Space Apps Challenge 2026**,
**Dancing with the SARs** challenge.

The project uses:

- NASA-ISRO NISAR sample product structures;
- a NASA/ASF sample GUNW product;
- NASA GIBS imagery for geographic context;
- open-source Python and web-development tools listed in this repository.

NASA and ASF provide the source data and services; TerraCascade is an
independent challenge project and should not be read as an official NASA
operational product.

## License

This repository does not currently declare an open-source license. Add an
appropriate license before distributing or inviting reuse of the code.
