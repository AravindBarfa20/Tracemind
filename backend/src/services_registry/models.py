import uuid
from sqlalchemy import ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base, TimestampMixin

class Service(Base, TimestampMixin):
    """Service DB Model representing a registered service being observed."""
    
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(
        String(1000),
        nullable=True,
    )
    service_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,  # api, worker, cron, frontend
    )
    environment: Mapped[str] = mapped_column(
        String(50),
        nullable=False,  # production, staging, development
    )
    base_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
    )
    health_endpoint: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
    )
    team: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    tags: Mapped[list] = mapped_column(
        JSONB,
        server_default=text("'[]'"),
        nullable=False,
    )
    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        server_default=text("'{}'"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        server_default=text("'active'"),
        nullable=False,
        index=True,  # active, inactive, deprecated
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    project = relationship("Project", back_populates="services")
    owner = relationship("User")

    __table_args__ = (
        UniqueConstraint("project_id", "slug", name="uq_services_project_slug"),
    )
