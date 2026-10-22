import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False)
    job_type: Mapped[str] = mapped_column(String(50), default="EXTRACTION", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True, nullable=False)
    stage: Mapped[str | None] = mapped_column(String(50), default="init", nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    safe_error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    report = relationship("Report", back_populates="jobs")
