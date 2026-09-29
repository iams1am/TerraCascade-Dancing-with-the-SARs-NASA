# Demonstration-region processing

## Source

The source is the NASA/ASF sample Level 2 Geocoded Unwrapped Interferogram
(GUNW) HDF5 product recorded in `data/README.md`. Its geocoded footprint is
in UTM zone 11N (`EPSG:32611`) over Southern California.

## Scientific layer

The exported layer is:

```text
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/unwrappedPhase
```

It is displayed in **radians**. No wavelength, incidence-angle, or line-of-sight
conversion was applied, so the frontend does not label this layer as
displacement.

## Quality filtering

The pipeline reads the paired `coherenceMagnitude` and `mask` datasets. It
excludes non-finite phase/coherence values, mask fill `255`, water pixels, zero
reference or secondary subswath digits, and coherence below `0.3`.

The bounded AOI is:

```text
EPSG:32611
x: 395040–430000 m
y: 3830060–3874940 m
```

The exact output statistics and source paths are recorded in
`data/processed/demo_region/metadata.json` and the browser assets under
`web/public/data/`.

## Temporal validation

The product contains a reference acquisition on 2008-10-12 and a secondary
acquisition on 2008-11-27, separated by 46 days. The pipeline validates their
ordering and records the result in
`data/processed/demo_region/temporal_validation.json` and
`web/public/data/temporal-validation.json`.

This is a valid temporal pair, not a persistent time series. No value is
interpolated between the acquisitions.

## Interpretation boundary

The product provides one reference/secondary interferogram pair with a
46-day temporal baseline. That is enough to demonstrate a measured phase
surface and its quality controls, but not enough to claim persistent
deformation or a cause. Additional compatible GUNW products and contextual
validation are required for those claims.
