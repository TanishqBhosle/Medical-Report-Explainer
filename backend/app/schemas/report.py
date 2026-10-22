from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class ReportUploadResponse(BaseModel):
    report_id: str
    job_id: str
    status: str
    status_url: str


class ReportResponse(BaseModel):
    id: str
    owner_user_id: str
    original_filename: str
    media_type: str
    file_size_bytes: int
    page_count: Optional[int] = None
    document_date: Optional[date] = None
    laboratory_name: Optional[str] = None
    processing_status: str
    language: Optional[str] = "en"
    created_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    total: int
    items: List[ReportResponse]
