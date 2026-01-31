"""Study schemas for CTMS IDOR."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.study import StudyStatus


class StudyBase(BaseModel):
    """Base study schema with common fields."""

    protocol_number: str = Field(..., min_length=1, max_length=100)
    short_name: str = Field(..., min_length=1, max_length=100)
    full_title: str = Field(..., min_length=1, max_length=1000)
    sponsor: str = Field(..., min_length=1, max_length=255)
    phase: str | None = Field(None, max_length=20)
    therapeutic_area: str | None = Field(None, max_length=255)
    status: StudyStatus = StudyStatus.IN_STARTUP
    enrollment_target: int | None = Field(None, ge=0)
    current_enrollment: int = Field(0, ge=0)
    pi_name: str | None = Field(None, max_length=255)
    start_date: date | None = None
    estimated_end_date: date | None = None


class StudyCreate(StudyBase):
    """Schema for creating a new study."""

    pass


class StudyUpdate(BaseModel):
    """Schema for updating a study (all fields optional)."""

    protocol_number: str | None = Field(None, min_length=1, max_length=100)
    short_name: str | None = Field(None, min_length=1, max_length=100)
    full_title: str | None = Field(None, min_length=1, max_length=1000)
    sponsor: str | None = Field(None, min_length=1, max_length=255)
    phase: str | None = Field(None, max_length=20)
    therapeutic_area: str | None = Field(None, max_length=255)
    status: StudyStatus | None = None
    enrollment_target: int | None = Field(None, ge=0)
    current_enrollment: int | None = Field(None, ge=0)
    pi_name: str | None = Field(None, max_length=255)
    start_date: date | None = None
    estimated_end_date: date | None = None


class StudyResponse(StudyBase):
    """Schema for study response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    enrollment_percentage: float | None = None
    action_items_count: int | None = None
    open_action_items_count: int | None = None


class StudyList(BaseModel):
    """Schema for paginated study list."""

    items: list[StudyResponse]
    total: int
    page: int
    page_size: int
    pages: int
