import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base, TimestampMixin

class ReplaySession(Base, TimestampMixin):
    """ReplaySession DB Model representing a recorded traffic session for regression playback."""
    
    __tablename__ = "replay_sessions"

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
    )
    recorded_requests: Mapped[list] = mapped_column(
        JSONB,
        server_default=text("'[]'"),
        nullable=False,
    )

    # Relationship to service
    service = relationship("Service")
