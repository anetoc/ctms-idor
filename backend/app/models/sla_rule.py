"""SLA Rule model for CTMS IDOR."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, Integer, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base
from app.models.action_item import ActionItemCategory, SeverityLevel
from app.models.user import UserRole


class SLARule(Base):
    """SLA rules for action item deadlines and escalations."""

    __tablename__ = "sla_rules"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    category: Mapped[ActionItemCategory | None] = mapped_column(
        Enum(
            ActionItemCategory,
            name="action_item_category",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=True,
    )
    severity: Mapped[SeverityLevel] = mapped_column(
        Enum(
            SeverityLevel,
            name="severity_level",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    resolution_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    escalation_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    escalation_to_role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
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

    def __repr__(self) -> str:
        cat = self.category.value if self.category else "all"
        return f"<SLARule {cat}/{self.severity.value}: {self.resolution_hours}h>"
