import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Explanation(Base):
    __tablename__ = "explanations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    question: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    model_provider: Mapped[str] = mapped_column(String(50), default="internal-rag", nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="clinical-rag-v1", nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    safety_status: Mapped[str] = mapped_column(String(30), default="PASSED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    report = relationship("Report", back_populates="explanations")
    owner = relationship("User", back_populates="explanations")
    citations = relationship("ExplanationCitation", back_populates="explanation", cascade="all, delete-orphan")
