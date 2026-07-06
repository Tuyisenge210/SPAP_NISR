from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from api.routers import health, indicators, tables, viz, reports, upload, metadata, validation, logs

load_dotenv()


class ApiEnvelope(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Rwanda LFS Analytics API",
    description="Backend API for the Rwanda Labour Force Survey Statistical Automation Platform.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiEnvelope(success=False, error=exc.detail).model_dump(),
        )
    return JSONResponse(
        status_code=500,
        content=ApiEnvelope(success=False, error=str(exc)).model_dump(),
    )


app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(indicators.router, prefix="/api/v1", tags=["indicators"])
app.include_router(tables.router, prefix="/api/v1", tags=["tables"])
app.include_router(viz.router, prefix="/api/v1", tags=["viz"])
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(metadata.router, prefix="/api/v1", tags=["metadata"])
app.include_router(validation.router, prefix="/api/v1", tags=["validation"])
app.include_router(logs.router, prefix="/api/v1", tags=["logs"])


@app.get("/", response_model=ApiEnvelope)
async def root():
    return ApiEnvelope(data={"message": "Rwanda LFS Analytics API", "version": "1.0.0"})