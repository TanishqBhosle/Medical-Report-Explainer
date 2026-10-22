import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False)
    test_name_original: Mapped[str] = mapped_column(String(255), nullable=False)
    test_name_normalized: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    value_text: Mapped[str] = mapped_column(String(100), nullable=False)
    value_numeric: Mapped[float | None] = mapped_column(Float, nullable=True)
    comparator: Mapped[str | None] = mapped_column(String(10), nullable=True)  # <, >, <=, >=
    unit_original: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_normalized: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    reference_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    reference_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reported_flag: Mapped[str] = mapped_column(String(20), default="unknown", nullable=False)  # low, normal, high, critical, unknown, conflict
    extraction_confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    validation_status: Mapped[str] = mapped_column(String(30), default="verified", nullable=False)  # verified, needs_review, invalid
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Medical accuracy & provenance fields
    flag_conflict: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    discrepancy_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_user_corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_corrected_value_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_correction_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    report = relationship("Report", back_populates="observations")
