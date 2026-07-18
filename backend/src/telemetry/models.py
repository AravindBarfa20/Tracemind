import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, DateTime, Float, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class Log(Base):
    """Log DB Model representing a captured log line from an observed service."""
    
    __tablename__ = "logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    attributes: Mapped[dict] = mapped_column(
        JSONB,
        server_default=text("'{}'"),
        nullable=False,
    )

    # Relationship to service
    service = relationship("Service")

class Span(Base):
    """Span DB Model representing a distributed trace span."""
    
    __tablename__ = "spans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    trace_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    span_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    parent_span_id: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    duration_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    attributes: Mapped[dict] = mapped_column(
        JSONB,
        server_default=text("'{}'"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="OK",
    )

    # Relationship to service
    service = relationship("Service")

class Metric(Base):
    """Metric DB Model representing a aggregated telemetry metric value."""
    
    __tablename__ = "metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    labels: Mapped[dict] = mapped_column(
        JSONB,
        server_default=text("'{}'"),
        nullable=False,
    )

    # Relationship to service
    service = relationship("Service")
