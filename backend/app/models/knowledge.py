import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, Float, Boolean, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="guideline", nullable=False)
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    license_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    chunks = relationship("KnowledgeChunk", back_populates="source", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False)
    canonical_test_name: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    source = relationship("KnowledgeSource", back_populates="chunks")
    citations = relationship("ExplanationCitation", back_populates="chunk", cascade="all, delete-orphan")


class ExplanationCitation(Base):
    __tablename__ = "explanation_citations"

    explanation_id: Mapped[str] = mapped_column(String(36), ForeignKey("explanations.id", ondelete="CASCADE"), primary_key=True)
    knowledge_chunk_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_chunks.id", ondelete="CASCADE"), primary_key=True)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    citation_role: Mapped[str] = mapped_column(String(50), default="supporting_evidence", nullable=False)

    explanation = relationship("Explanation", back_populates="citations")
    chunk = relationship("KnowledgeChunk", back_populates="citations")
