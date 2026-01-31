"""Action Item schemas for CTMS IDOR."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.action_item import ActionItemCategory, ActionItemStatus, SeverityLevel


class ActionItemBase(BaseModel):
    """Base action item schema with common fields."""

    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    category: ActionItemCategory = ActionItemCategory.OTHER
    severity: SeverityLevel = SeverityLevel.MINOR
    due_date: datetime | None = None


class ActionItemCreate(ActionItemBase):
    """Schema for creating a new action item."""

    study_id: UUID
    monitor_letter_id: UUID | None = None
    assigned_to: UUID | None = None


class ActionItemUpdate(BaseModel):
    """Schema for updating an action item (all fields optional)."""

    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    category: ActionItemCategory | None = None
    severity: SeverityLevel | None = None
    status: ActionItemStatus | None = None
    assigned_to: UUID | None = None
    due_date: datetime | None = None
    comment: str | None = Field(None, max_length=2000, description="Comment for audit trail")


class ActionItemStatusUpdate(BaseModel):
    """Schema for quick status update."""

    status: ActionItemStatus
    comment: str | None = Field(None, max_length=2000)


class ActionItemUpdateResponse(BaseModel):
    """Schema for action item update (audit trail entry)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    user_name: str | None = None
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    comment: str | None
    created_at: datetime


class AssigneeResponse(BaseModel):
    """Minimal user info for assignee."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str


class StudyMinimalResponse(BaseModel):
    """Minimal study info for action item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    protocol_number: str
    short_name: str


class ActionItemResponse(ActionItemBase):
    """Schema for action item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    study_id: UUID
    monitor_letter_id: UUID | None
    status: ActionItemStatus
    assigned_to: UUID | None
    created_by: UUID
    sla_deadline: datetime | None
    escalation_level: int
    resolved_at: datetime | None
    verified_at: datetime | None
    verified_by: UUID | None
    created_at: datetime
    updated_at: datetime

    # Computed fields
    is_open: bool
    is_overdue: bool
    days_until_deadline: float | None = None

    # Nested objects (optional, loaded on detail view)
    assignee: AssigneeResponse | None = None
    study: StudyMinimalResponse | None = None
    updates: list[ActionItemUpdateResponse] | None = None


class ActionItemList(BaseModel):
    """Schema for paginated action item list."""

    items: list[ActionItemResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ActionItemStats(BaseModel):
    """Schema for action item statistics."""

    total: int
    open: int
    overdue: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_severity: dict[str, int]
    sla_compliance_percentage: float
    average_resolution_hours: float | None


class DashboardKPIs(BaseModel):
    """Schema for dashboard KPIs."""

    overdue_count: int
    aging_p90_days: float | None
    total_items: int
    sla_compliance_pct: float
    items_by_severity: dict[str, int]
    items_created_last_7_days: int
    items_resolved_last_7_days: int


class BurndownDataPoint(BaseModel):
    """Schema for burndown chart data point."""

    date: str
    open_items: int
    closed_items: int
    cumulative_closed: int


class ParetoItem(BaseModel):
    """Schema for Pareto chart item."""

    category: str
    count: int
    percentage: float
    cumulative_percentage: float
