import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, BigInteger, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    media_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unreadable_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    document_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    laboratory_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    processing_status: Mapped[str] = mapped_column(String(50), default="UPLOADED", index=True, nullable=False)
    language: Mapped[str | None] = mapped_column(String(10), default="en", nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="reports")
    jobs = relationship("ProcessingJob", back_populates="report", cascade="all, delete-orphan")
    observations = relationship("Observation", back_populates="report", cascade="all, delete-orphan")
    explanations = relationship("Explanation", back_populates="report", cascade="all, delete-orphan")
