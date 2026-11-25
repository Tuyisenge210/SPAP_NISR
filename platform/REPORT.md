# SPAP — status report and next phases

_Short working note for the merge discussion. Branch `feat/spap-platform`, commit `0f9120a`._

## 1. What this build is

A clean-room implementation of the SPAP LFS production pipeline, because
`Tuyisenge210/SPAP_NISR` is private and could not be cloned into this environment.
The engine, API shape and traceability model are meant to be ported onto the NISR
codebase, not to replace it.

## 2. What was delivered and verified

| Area | State |
|---|---|
| Engine (`engine/`) | Ingestion, harmonisation, 9 validation checks, derived variables, weighting, 10 indicators, 15 chapter tables, Excel export |
| API (`api/server.py`) | Datasets, catalogue, validation, produce, run history, traceability, per-chapter and full export, CSV upload |
| Console (`src/`) | Overview status board, Produce, Catalogue, Traceability, Validation, Runs; responsive shell |
| Provenance | Every cell keeps numerator and denominator; every indicator names its formula and Python function |
| Measured | 5,200 records → 15 tables in ~410 ms; export 11 sheets, 20 KB, values read back with OpenPyXL; `npm run build` passes |

Honest limits: the shipped data is a **deterministic calibration sample, not NISR
figures**; 13 catalogue tables are specified but unimplemented; runs live in memory;
no authentication; `.dta` ingestion not wired; wide-desktop layout not visually checked.

## 3. Gaps against the intended product

1. **Identity** — NISR blue and white, not the current dark console.
2. **Login and roles** — no accounts, no permissions, no run attribution.
3. **Survey context** — the platform speaks only LFS; the brief covers DHS and others.
4. **Homepage** — lands on a production form; it does not answer "what is happening now?"
5. **Persistence and real data** — memory-only runs, no `.dta` loader.

## 4. Next phases

**Phase 1 — NISR identity (started, remainder small).**
The console now runs NISR blue on white as a light default: panel, text, badge, chart,
table and focus colours were replaced across `src/theme.css`, and the three trend series
were recoloured for a white background. Remaining: the official logo asset (SVG) and the
exact blue hex sampled from it rather than approximated, logo in the sidebar and on every
exported workbook cover, plus a formal WCAG AA contrast pass.

**Phase 2 — Homepage that reports state (started, remainder small).**
A new Overview view is now the landing screen: survey and year in scope, latest run with
its nine steps, data readiness (records, fingerprint), validation state, table coverage by
chapter, recent runs and the last exported workbook (backed by a new `/api/exports`
record). Remaining: scope the board to the signed-in user's role once accounts exist, and
add a "start this quarter's production" action for producers.

**Phase 3 — Accounts, roles, audit (medium, 1 week).**
Sign-in, session, and four roles: **administrator** (users, survey setup), **producer**
(runs and exports), **analyst** (analysis and drafts, cannot publish), **viewer**
(published tables only — the outside-user portal). Enforce in the API, not just the UI:
every produce/export route checks role, each run records who and when, and a read-only
audit log records production and publication events.

**Phase 4 — Survey workspace (large, 2–3 weeks).**
Promote the dataset/year picker into a survey context: a registry of surveys (LFS, DHS,
EICV, establishment surveys), each with its own variable mapping, indicator set, table
catalogue and validation rules. Technically this means an interface — `SurveyProfile` —
that `engine/metadata.py`, `indicators.py` and `tables.py` read from, so LFS becomes one
implementation instead of the only one. Users pick their survey (and year/round) once;
the whole console, including the homepage board, scopes to it.

**Phase 5 — Real data and durability (medium, 1–2 weeks).**
Stata `.dta` ingestion via `pyreadstat`, a persisted run store (SQLite first), stored
exports with checksums, and versioned dataset fingerprints so a published table can be
reproduced months later from the file that produced it.

**Phase 6 — Coverage and publication (ongoing).**
Implement Tables 10–11, 13, 15–20, 22–25; add quarterly production; then the external
portal: published tables and figures only, no microdata, no run controls.

## 5. Suggested order

Phases 1 and 2 first — they are cheap and they change how the platform reads to NISR
staff and to visitors. Phase 3 before any pilot with real users, because attribution
and permissions are hard to retrofit onto stored runs. Phase 4 before the second survey
is attempted; doing it after DHS work has started duplicates effort.
