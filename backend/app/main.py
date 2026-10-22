import time
import uuid
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed_knowledge import seed_knowledge_base

import app.models
from app.api.routes import auth, reports, observations, explanations, comparison, jobs, health

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

# Seed knowledge base
with SessionLocal() as db_session:
    seed_knowledge_base(db_session)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_and_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    # Redacted log
    logger.info(f"Incoming {request.method} {request.url.path} [ReqID: {request_id}]")

    response = await call_next(request)
    duration = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    logger.info(f"Completed {request.method} {request.url.path} -> {response.status_code} in {duration:.3f}s [ReqID: {request_id}]")
    return response


# Safe error handlers preventing stack trace leakage
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = getattr(request.state, "request_id", "unknown")
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", "HTTP_ERROR")
        msg = detail.get("message", str(detail))
    else:
        code = "HTTP_ERROR"
        msg = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": msg,
                "request_id": req_id
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Invalid request data."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "SCHEMA_VALIDATION_FAILED",
                "message": first_error,
                "request_id": req_id
            }
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception [ReqID: {req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred while processing your request. Please try again later.",
                "request_id": req_id
            }
        }
    )


# Include API Routers under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(observations.router, prefix=settings.API_V1_STR)
app.include_router(explanations.router, prefix=settings.API_V1_STR)
app.include_router(comparison.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health/live"
    }
