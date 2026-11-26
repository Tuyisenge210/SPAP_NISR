# SPAP — Statistical Production and Analytics Platform

A reproducible LFS statistical production system: **raw microdata → validation → weighted
indicators → chapter tables → publication-ready Excel**, with a dashboard and figures that
consume the same validated results rather than recalculating them.

This is a clean-room build (branch `feat/spap-platform`). It was written because
`Tuyisenge210/SPAP_NISR` is private and could not be cloned into this environment; the
architecture follows the SPAP brief (Python engine, Panda-free core, OpenPyXL export,
existing UI/API split) and is meant to be merged into / ported onto the NISR codebase.

## What works today

- **Overview board** — the landing view answers "what is happening": survey and year in
  scope, last run and its nine steps, data readiness (records and fingerprint), validation
  state, table coverage by chapter and the last workbook exported.
- **Nine recorded production steps** — ingestion, harmonisation, validation, derived variables
  and weighting, indicators, chapter tables, preview, export readiness, reproducibility —
  each with a real timing and detail string shown in the UI.
- **15 tables wired to producers** across Chapters 1–9, 10 and 11 (national summary, by sex,
  urban/rural, youth, age, education, subsistence agriculture, economic activity, occupation,
  employment status, informality, districts). The remaining 13 catalogue entries (Tables
  10–11, 13, 15–20, 22–25) are registered as *planned* with specifications, visibly not
  implemented.
- **10 indicators** with full definitions: LFPR, EPR, UR1 (LU1), LU2, LU3, LUUR, informality,
  subsistence share, time-related underemployment, youth unemployment.
- **Traceability chain** — Table → Indicator → Definition → Population → Variables → Derived
  variables → Weight → Numerator/Denominator → Formula → Python function → Result.
- **Excel export** per chapter and for the whole run (OpenPyXL, formatted headers, estimation
  basis, provenance footer, plus a calibration-sample warning).
- **Validation** — nine structural/consistency checks; blocking failures halt production.
- **Run history** with dataset, year, record count, dataset fingerprint and duration.

## Layout

```
engine/            # statistical engine (no web dependencies)
  metadata.py      # variable registry, indicator definitions, chapter/table catalogue
  lfs_data.py      # microdata ingestion (calibration generator + CSV loader)
  indicators.py    # weighted indicator functions + derived-variable predicates
  tables.py        # chapter table builders
  validation.py    # structural and consistency checks
  pipeline.py      # recorded nine-step production workflow
  export.py        # publication-ready Excel workbooks
api/server.py      # FastAPI service: datasets, catalogue, produce, runs, trace, export, upload
src/               # React 19 + Vite console
  App.tsx          # shell, dataset/year controls, auto-run, upload
  views/index.tsx  # Overview, Produce, Catalogue, Traceability, Validation, Runs
  components/ui.tsx# KPI cards, stepper, data tables, charts
  theme.css        # design system (NISR blue on white, responsive)
data/microdata/    # <dataset>__<year>.csv field extracts (empty until official data is mounted)
artifacts/         # screenshots captured during development
```

## Running it

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
npm install

# terminal 1 — engine API on :8099
.venv/bin/python -m uvicorn api.server:app --host 0.0.0.0 --port 8099

# terminal 2 — UI on :3000 (proxies /api → :8099)
npm run dev -- --host 0.0.0.0 --port 3000
```

Then open <http://localhost:3000>. The UI produces a run automatically on first load.

## Data honesty

The shipped dataset is a **deterministic calibration sample** (`LFS_CALIBRATION`, 5,200 person
records per year, 2020–2025). It exercises the entire pipeline — weights, indicators, tables,
exports — but it is **not official statistics**, and every table, export and screen says so.

To produce real figures, place a CSV extract at `data/microdata/<DATASET>__<YEAR>.csv` with at
least `sex, age, ilo_activity, weight` (plus `province, district, residence, education,
discouraged, available_not_seeking, subsistence_agri, informal, status_employment, occupation,
industry, hours_worked` for the full table set), or upload one from the UI. The same weighting
and table code then runs unchanged.

Mounting Stata `.dta` microdata is the next integration point: add a loader in
`engine/lfs_data.py` (pandas + pyreadstat) returning the same row shape, and everything
downstream works as-is.

## Deliberately not done yet

- Tables 10–11, 13, 15–20, 22–25 have catalogue specifications but no producers.
- No quarterly production, no multi-year harmonisation matrix yet (the year selector and
  per-year generators are in place).
- No authentication, no database: runs live in process memory and exports are generated on
  demand. Persistence is the next step before this leaves a single analyst's machine.
- `engine/` is pure Python; pandas/numpy are only needed once real `.dta` files are mounted.
