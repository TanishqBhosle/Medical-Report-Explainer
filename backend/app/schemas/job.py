from pydantic import BaseModel, ConfigDict
from typing import Optional


class JobStatusResponse(BaseModel):
    job_id: str
    report_id: str
    status: str
    stage: Optional[str] = None
    progress_percent: int
    safe_error_code: Optional[str] = None
    safe_error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
