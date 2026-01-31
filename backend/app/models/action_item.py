"""Action Item models for CTMS IDOR."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base

if TYPE_CHECKING:
    from app.models.study import Study
    from app.models.user import User


class ActionItemStatus(str, enum.Enum):
    """Action item workflow status."""

    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING_EXTERNAL = "waiting_external"
    DONE = "done"
    VERIFIED = "verified"


class ActionItemCategory(str, enum.Enum):
    """Action item categories."""

    REGULATORY = "regulatory"
    CONSENT_ICF = "consent_icf"
    DATA_ENTRY = "data_entry"
    QUERIES = "queries"
    SAFETY_REPORTING = "safety_reporting"
    SAMPLES = "samples"
    IMAGING = "imaging"
    PHARMACY_IP = "pharmacy_ip"
    TRAINING = "training"
    CONTRACTS_BUDGET = "contracts_budget"
    OTHER = "other"


class SeverityLevel(str, enum.Enum):
    """Severity levels for prioritization."""

    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    INFO = "info"


class ActionItem(Base):
    """Action item model representing tasks from monitor letters and other sources."""

    __tablename__ = "action_items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    study_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    monitor_letter_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ActionItemCategory] = mapped_column(
        Enum(
            ActionItemCategory,
            name="action_item_category",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=ActionItemCategory.OTHER,
        index=True,
    )
    severity: Mapped[SeverityLevel] = mapped_column(
        Enum(
            SeverityLevel,
            name="severity_level",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=SeverityLevel.MINOR,
        index=True,
    )
    status: Mapped[ActionItemStatus] = mapped_column(
        Enum(
            ActionItemStatus,
            name="action_item_status",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=ActionItemStatus.NEW,
        index=True,
    )
    assigned_to: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    sla_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    escalation_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    verified_by: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
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
    study: Mapped["Study"] = relationship("Study", back_populates="action_items")
    assignee: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_items",
    )
    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_items",
    )
    verifier: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[verified_by],
        back_populates="verified_items",
    )
    updates: Mapped[list["ActionItemUpdate"]] = relationship(
        "ActionItemUpdate",
        back_populates="action_item",
        cascade="all, delete-orphan",
        order_by="ActionItemUpdate.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<ActionItem {self.id}: {self.title[:50]}>"

    @property
    def is_open(self) -> bool:
        """Check if action item is still open."""
        return self.status not in (ActionItemStatus.DONE, ActionItemStatus.VERIFIED)

    @property
    def is_overdue(self) -> bool:
        """Check if action item is past SLA deadline."""
        if not self.sla_deadline or not self.is_open:
            return False
        return datetime.now(self.sla_deadline.tzinfo) > self.sla_deadline


class ActionItemUpdate(Base):
    """Audit trail for action item changes."""

    __tablename__ = "action_item_updates"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    action_item_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("action_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    field_changed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    action_item: Mapped["ActionItem"] = relationship(
        "ActionItem",
        back_populates="updates",
    )
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<ActionItemUpdate {self.id}: {self.field_changed}>"
