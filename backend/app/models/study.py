"""Study model for CTMS IDOR."""

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Date, DateTime, Enum, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base

if TYPE_CHECKING:
    from app.models.action_item import ActionItem


class StudyStatus(str, enum.Enum):
    """Study lifecycle status."""

    ACTIVE = "active"
    CLOSED = "closed"
    SUSPENDED = "suspended"
    IN_STARTUP = "in_startup"


class Study(Base):
    """Study model representing clinical trials."""

    __tablename__ = "studies"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    protocol_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )
    short_name: Mapped[str] = mapped_column(String(100), nullable=False)
    full_title: Mapped[str] = mapped_column(String(1000), nullable=False)
    sponsor: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phase: Mapped[str | None] = mapped_column(String(20), nullable=True)
    therapeutic_area: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[StudyStatus] = mapped_column(
        Enum(
            StudyStatus,
            name="study_status",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=StudyStatus.IN_STARTUP,
        index=True,
    )
    enrollment_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_enrollment: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pi_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    action_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem",
        back_populates="study",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Study {self.protocol_number}: {self.short_name}>"

    @property
    def enrollment_percentage(self) -> float | None:
        """Calculate enrollment percentage."""
        if self.enrollment_target and self.enrollment_target > 0:
            return round((self.current_enrollment / self.enrollment_target) * 100, 1)
        return None
