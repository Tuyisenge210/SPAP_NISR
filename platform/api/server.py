"""FastAPI service exposing the SPAP analytical engine."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from engine import pipeline
from engine.export import build_workbook
from engine.lfs_data import MICRODATA_DIR, list_datasets
from engine.metadata import INDICATORS, catalogue_payload
from engine.validation import run_checks

app = FastAPI(
    title="SPAP API",
    version="0.1.0",
    description=(
        "Statistical Production and Analytics Platform — LFS ingestion, validation, "
        "weighted indicators, chapter tables and publication exports."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent

# Export events are the publication trail: what workbook left the platform, when.
EXPORTS: list[dict] = []
_MAX_EXPORTS = 50


class ProduceRequest(BaseModel):
    dataset: str = Field(default="LFS_CALIBRATION")
    year: int = Field(default=2025, ge=1990, le=2100)
    chapters: list[int] | None = None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "spap-api", "version": app.version}


@app.get("/api/datasets")
def datasets() -> dict:
    return {"datasets": list_datasets()}


@app.get("/api/catalogue")
def catalogue() -> dict:
    return catalogue_payload()


@app.get("/api/validation")
def validation(
    dataset: str = Query(default="LFS_CALIBRATION"),
    year: int = Query(default=2025),
) -> dict:
    try:
        data = pipeline.load_cached(dataset, year)
    except Exception as exc:  # pragma: no cover - surfaces loader problems to the UI
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result = run_checks(data)
    return {
        **result,
        "dataset_label": data.label,
        "source": data.source,
        "synthetic": data.source.startswith("synthetic"),
        "fingerprint": data.fingerprint,
    }


@app.post("/api/produce")
def produce(request: ProduceRequest) -> dict:
    try:
        run = pipeline.produce(request.dataset, request.year, request.chapters)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return _run_payload(run)


@app.get("/api/runs")
def runs() -> dict:
    return {"runs": pipeline.list_runs()}


@app.get("/api/runs/{run_id}")
def run_detail(run_id: str) -> dict:
    run = pipeline.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_payload(run)


@app.get("/api/trace/{indicator_code}")
def trace(indicator_code: str) -> dict:
    try:
        return pipeline.trace(indicator_code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown indicator {indicator_code}") from exc


@app.get("/api/trace")
def trace_index() -> dict:
    return {"indicators": list(INDICATORS.keys()), "definitions": INDICATORS}


@app.get("/api/export/{run_id}")
def export(run_id: str, scope: str = Query(default="all")) -> StreamingResponse:
    run = pipeline.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    stream = build_workbook(run, scope)
    filename = f"SPAP_LFS_{run['year']}_chapter_{scope}.xlsx" if scope != "all" else f"SPAP_LFS_{run['year']}_all_tables.xlsx"
    try:
        size = len(stream.getbuffer())
    except Exception:  # pragma: no cover - workbook streams are BytesIO in practice
        size = 0
    EXPORTS.append(
        {
            "run_id": run_id,
            "scope": scope,
            "filename": filename,
            "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "bytes": size,
        }
    )
    if len(EXPORTS) > _MAX_EXPORTS:
        del EXPORTS[:-_MAX_EXPORTS]
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/datasets/upload")
async def upload_dataset(request: Request, dataset: str = Query(...), year: int = Query(...)) -> dict:
    raw = await request.body()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")
    text = raw.decode("utf-8-sig", errors="replace")
    header = text.splitlines()[0] if text.splitlines() else ""
    required = {"sex", "age", "ilo_activity", "weight"}
    missing = required - {c.strip() for c in header.split(",")}
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(sorted(missing))}",
        )

    safe = re.sub(r"[^A-Za-z0-9_-]+", "_", dataset).strip("_").upper() or "UPLOAD"
    MICRODATA_DIR.mkdir(parents=True, exist_ok=True)
    target = MICRODATA_DIR / f"{safe}__{year}.csv"
    target.write_text(text, encoding="utf-8")
    pipeline._DATA_CACHE.clear()
    return {"ok": True, "dataset": safe, "year": year, "file": target.name, "datasets": list_datasets()}


@app.get("/api/exports")
def exports() -> dict:
    return {"exports": list(reversed(EXPORTS))[:10], "count": len(EXPORTS)}


def _run_payload(run: dict) -> dict:
    """Runs are returned whole: the validation block is part of the audit trail,
    for blocked and complete runs alike."""
    return dict(run)


@app.exception_handler(ValueError)
def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


# Serve the built frontend when it exists (production mode).
DIST = ROOT / "dist"
if DIST.exists():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=str(DIST), html=True), name="static")
