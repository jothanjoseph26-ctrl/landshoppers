from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.routers import extract, health, seo
from app.services.rate_limit import SimpleRateLimiter

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings.from_env()
    app.state.settings = settings
    app.state.limiter = SimpleRateLimiter(settings.rate_limit_per_minute)
    yield


app = FastAPI(
    title="LandShoppers AI Service",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4001",
        "http://127.0.0.1:4001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(extract.router)
app.include_router(seo.router)


@app.get("/")
def root() -> dict:
    return {
        "service": "landshoppers-ai-service",
        "docs": "/docs",
        "health": "/health",
        "extractListing": "/extract-listing",
        "generateSeoVariants": "/generate-seo-variants",
    }
