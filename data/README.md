# TerraCascade data

Raw Earth-observation products are intentionally excluded from version
control. Place the product selected for the October MVP in `data/raw/` and
record:

- filename and source URL
- product type and processing level
- observation dates
- geographic coverage
- download date
- license and known limitations

## Phase 1 source product

The current discovery input is the official NASA/ASF sample GUNW product:

- **Filename:** `NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001.h5`
- **Product:** Level 2 Geocoded Unwrapped Interferogram (GUNW)
- **Observation dates:** 2008-10-12 and 2008-11-27, encoded in the product name
- **Region:** to be confirmed from the product geolocation metadata
- **Source:** [NASA/ASF sample GUNW](https://nisar.asf.earthdatacloud.nasa.gov/NISAR-SAMPLE-DATA/GUNW/NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001/NISAR_L2_PR_GUNW_001_030_A_019_002_2000_SH_20081012T060911_20081012T060925_20081127T061000_20081127T061014_D00404_N_F_J_001.h5)
- **Download date:** 2026-09-29
- **Maturity:** NASA/ASF sample data in NISAR-compatible HDF5 format; the historical surrogate-era dates must not be presented as current operational NISAR acquisitions

The inventory is now recorded at
`docs/methodology/nisar_inventory.json`. The extracted browser assets under
`web/public/data/` are derived only from the verified paths and retain their
units, projection, quality threshold, source product, and limitations.
