import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base, TimestampMixin

class Incident(Base, TimestampMixin):
    """Incident DB Model representing a triggered alerting state for a service."""
    
    __tablename__ = "incidents"

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
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    severity: Mapped[str] = mapped_column(
        String(50),
        nullable=False,  # critical, warning, info
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="triggered",
        server_default=text("'triggered'"),
        nullable=False,
        index=True,  # triggered, acknowledged, resolved
    )
    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationship to service
    service = relationship("Service")
