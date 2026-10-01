# SPAP_NISR

SPAP_NISR is a local statistical production and analytics workspace for Rwanda Labour Force Survey (LFS) microdata. It combines a React/TanStack web interface, a FastAPI service, and a Python weighted-indicator and table-production pipeline.

The default in-app dataset is a calibration sample for interface development. Official production results should be generated from the validated LFS microdata in `raw/`; do not treat the calibration sample as official estimates.

## Project Layout

- `api/`: FastAPI application and endpoints for health, metadata, indicators, tables, reports, uploads, validation, logs, and visualizations.
- `labour_analytics/`: Stata ingestion, harmonization, indicator computation, chapter tables, Excel publishing, catalogue generation, validation, and visualization datasets.
- `labour_analytics/chapters/`: ordered chapter producers `py01.py` through `py11.py` plus shared weighted helpers in `common.py`.
- `src/`: React/TanStack frontend, routes, components, API clients, and state.
- `raw/`: annual LFS Stata microdata, expected as `RW_LFS2020.dta` through `RW_LFS2025.dta`.
- `data/`: supplementary survey files and variable descriptions/codebooks.
- `final/`: generated Excel/Parquet reports, catalogue JSON, coverage matrix, and visualization outputs.
- `tests/`: Python tests for chapter table production.

## Chapter Table Order

Each producer has a chapter title, table specifications (ID, input variables, and formula), and `CHAPTER N` comments at the calculation site.

- `py01`: Table 1, national summary indicators including LFPR, EPR, UR1, LU2, LU3, and LUUR.
- `py02`: Table 2, labour-force indicators by sex.
- `py03`: Tables 3.1-3.2, urban and rural indicators by sex.
- `py04`: Tables 4.1-4.3, youth/adult comparisons and youth splits.
- `py05`: Tables 5.1-5.4, age groups by sex and residence.
- `py06`: Tables 6.1-6.2, educational attainment by sex.
- `py07`: Tables 7.1-7.2, subsistence-agriculture participation by sex.
- `py08`: Tables 8-9, employed population by economic activity.
- `py09`: Tables 10-11, employed population by occupation.
- `py10`: Tables 12-20, education, employment status, informality, and agricultural employment.
- `py11`: Tables 21-25, district indicators split by observed province code.

The chapter engine produces 35 chapter tables. The existing seven legacy analysis tables are retained for compatibility, making 42 table keys available from the API table endpoint. `Pipeline.execute()` writes the ordered chapter outputs to `final/Rwanda_LFS_Main_Tables_2020_2025.xlsx`, retains the existing report outputs, and refreshes `final/lfs_production_catalogue.json` and `final/lfs_coverage_matrix.json`.

## Windows Requirements

- Windows 10 or 11 with PowerShell.
- Python 3.12 available through the Python launcher (`py -3.12`). The API requirements pin pandas 2.2.3; use Python 3.12 for this environment.
- Node.js 22 LTS with npm.
- Git for Windows.
- The project checkout and annual `.dta` files present on this PC.

Use the folder that contains `package.json`, `requirements-api.txt`, `api/`, and `raw/`. A GitHub VFS path shown in VS Code is not itself a local filesystem folder. If the current terminal does not see `package.json`, first install the missing tools and make a local checkout. Run only the `winget` lines for tools that are not already installed:

```powershell
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
winget install --id Python.Python.3.12 -e --accept-source-agreements --accept-package-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
```

Close and reopen PowerShell after installation so the updated PATH is loaded. Then clone the repository to a local folder:

```powershell
git clone https://github.com/Tuyisenge210/SPAP_NISR.git C:\Projects\SPAP_NISR
Set-Location C:\Projects\SPAP_NISR
```

If this VS Code session is editing a GitHub VFS worktree, cloning only downloads the committed GitHub revision. Commit/push or otherwise sync the current VFS changes before expecting the local checkout to contain them. Copy the LFS `.dta` inputs into the checkout's `raw/` folder if they are not included in the clone.

## Set Up Locally

Open a PowerShell terminal in the local repository root. Replace the example path if you cloned elsewhere:

```powershell
$ErrorActionPreference = "Stop"
Set-Location "C:\path\to\SPAP_NISR"

if (-not (Test-Path .\package.json)) {
    throw "This is not the repository root. Change to the folder containing package.json."
}
if (-not (Test-Path .\requirements-api.txt)) {
    throw "requirements-api.txt was not found in this folder."
}

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
    py -3.12 -m venv .venv
}
$PythonVersion = & .\.venv\Scripts\python.exe -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($PythonVersion -ne "3.12") {
    throw "The project venv must use Python 3.12; found $PythonVersion. Recreate .venv with py -3.12 -m venv .venv."
}
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements-api.txt
npm ci
```

The Python dependencies include FastAPI/Uvicorn, pandas, PyArrow, OpenPyXL, Pydantic, and python-dotenv. `npm ci` installs the frontend dependencies from `package-lock.json`.

If PowerShell blocks a project script, run this once in the current terminal and then rerun the script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Run the Application

Start the API in the first terminal, from the repository root:

```powershell
& .\.venv\Scripts\python.exe -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
```

Start the web app in a second terminal, also from the repository root:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the frontend URL printed by Vite (normally `http://127.0.0.1:5173`). The API root is `http://127.0.0.1:8000/`, interactive API documentation is at `http://127.0.0.1:8000/docs`, and OpenAPI JSON is at `http://127.0.0.1:8000/openapi.json`.

The repository launch scripts use the local virtual environment and repository-relative paths:

```powershell
.\run_api.ps1
```

Or from Command Prompt:

```bat
run_api.bat
```

These launchers start the API only. Start the frontend separately with `npm run dev -- --host 127.0.0.1`.

## Generate the LFS Tables

Confirm the raw annual files are available before starting a full production run:

```powershell
Get-ChildItem .\raw\RW_LFS*.dta
```

Run the production pipeline from the repository root:

```powershell
& .\.venv\Scripts\python.exe -c "from labour_analytics.pipeline import Pipeline; Pipeline().execute()"
```

The run harmonizes configured survey years, computes indicators, creates the legacy reports and chapter-ordered workbook, exports visualization data, refreshes the catalogues, and runs validation. Generated files are written under `final/`.

The table API can be checked from PowerShell while the API is running:

```powershell
$response = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/tables/standard"
$response.data.tables.PSObject.Properties.Name
```

To request one year:

```powershell
$response = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/tables/standard?year=2025"
$response.data.tables.PSObject.Properties.Name
```

## Verify Changes

Run the focused chapter tests:

```powershell
& .\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Check the frontend lint and production build:

```powershell
npm run lint
npm run build
```

The chapter test covers table-catalogue IDs, weighted headline calculations, the Table 20 workforce denominator, and the five district-table slots when province codes are absent from an extract.

## Statistical Release Checks

Table ordering follows the supplied NISR report images. Variable names were cross-checked against the local 2023 LFS variable-description CSV. Before publication, confirm the official NISR methodology, weighting and variance procedures, category labels, table denominators, and the numeric value for `C04` meaning “yes” against the release-specific documentation. Province and district values remain codes when their value labels are unavailable. These outputs should not be treated as release-ready estimates until those checks and the production validation are complete.