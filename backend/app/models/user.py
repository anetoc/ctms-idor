"""User model for CTMS IDOR."""

import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system."""

    ADMIN = "admin"
    OPS_MANAGER = "ops_manager"
    SC_LEAD = "sc_lead"
    STUDY_COORDINATOR = "study_coordinator"
    DATA_MANAGER = "data_manager"
    QUALITY = "quality"
    FINANCE = "finance"
    READONLY = "readonly"


class User(Base):
    """User model representing system users."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=UserRole.READONLY,
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

    # Relationships
    assigned_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem",
        foreign_keys="ActionItem.assigned_to",
        back_populates="assignee",
    )
    created_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem",
        foreign_keys="ActionItem.created_by",
        back_populates="creator",
    )
    verified_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem",
        foreign_keys="ActionItem.verified_by",
        back_populates="verifier",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# Import at bottom to avoid circular imports
from app.models.action_item import ActionItem  # noqa: E402, F401
