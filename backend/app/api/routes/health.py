import os
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


@router.get("/ready")
def readiness(response: Response, db: Session = Depends(get_db)):
    checks = {
        "database": False,
        "storage": False
    }

    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    # Check storage directory
    try:
        if os.path.exists(settings.STORAGE_DIR) and os.access(settings.STORAGE_DIR, os.W_OK):
            checks["storage"] = True
    except Exception:
        checks["storage"] = False

    all_ready = all(checks.values())
    if not all_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unhealthy", "checks": checks}

    return {"status": "ready", "checks": checks}
