"""Action Item routes for CTMS IDOR."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import ActiveUser, CoordinatorUser, DbSession
from app.models.action_item import ActionItem, ActionItemCategory, ActionItemStatus, SeverityLevel
from app.models.sla_rule import SLARule
from app.models.study import Study
from app.models.user import User
from app.repositories.action_item_repository import action_item_repository
from app.schemas.action_item import (
    ActionItemCreate,
    ActionItemList,
    ActionItemResponse,
    ActionItemStats,
    ActionItemStatusUpdate,
    ActionItemUpdate,
    ActionItemUpdateResponse,
    AssigneeResponse,
    StudyMinimalResponse,
)
from app.services.sla_engine import sla_engine

router = APIRouter(prefix="/action-items", tags=["Action Items"])


def build_action_item_response(
    item: ActionItem,
    include_relations: bool = False,
) -> ActionItemResponse:
    """Build ActionItemResponse from ActionItem model."""
    response = ActionItemResponse(
        id=item.id,
        study_id=item.study_id,
        monitor_letter_id=item.monitor_letter_id,
        title=item.title,
        description=item.description,
        category=item.category,
        severity=item.severity,
        status=item.status,
        assigned_to=item.assigned_to,
        created_by=item.created_by,
        due_date=item.due_date,
        sla_deadline=item.sla_deadline,
        escalation_level=item.escalation_level,
        resolved_at=item.resolved_at,
        verified_at=item.verified_at,
        verified_by=item.verified_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
        is_open=item.is_open,
        is_overdue=sla_engine.is_overdue(item),
        days_until_deadline=sla_engine.days_until_deadline(item),
    )

    if include_relations:
        if item.assignee:
            response.assignee = AssigneeResponse(
                id=item.assignee.id,
                name=item.assignee.name,
                email=item.assignee.email,
            )
        if item.study:
            response.study = StudyMinimalResponse(
                id=item.study.id,
                protocol_number=item.study.protocol_number,
                short_name=item.study.short_name,
            )
        if item.updates:
            response.updates = [
                ActionItemUpdateResponse(
                    id=u.id,
                    user_id=u.user_id,
                    user_name=u.user.name if u.user else None,
                    field_changed=u.field_changed,
                    old_value=u.old_value,
                    new_value=u.new_value,
                    comment=u.comment,
                    created_at=u.created_at,
                )
                for u in item.updates
            ]

    return response


@router.get("", response_model=ActionItemList)
async def list_action_items(
    db: DbSession,
    current_user: ActiveUser,
    study_id: UUID | None = Query(None, description="Filter by study"),
    status: ActionItemStatus | None = Query(None, description="Filter by status"),
    category: ActionItemCategory | None = Query(None, description="Filter by category"),
    severity: SeverityLevel | None = Query(None, description="Filter by severity"),
    assigned_to: UUID | None = Query(None, description="Filter by assignee"),
    overdue: bool = Query(False, description="Show only overdue items"),
    open_only: bool = Query(False, description="Show only open items"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> ActionItemList:
    """
    List action items with filters and pagination.

    - **study_id**: Filter by study
    - **status**: Filter by workflow status
    - **category**: Filter by category
    - **severity**: Filter by severity level
    - **assigned_to**: Filter by assigned user
    - **overdue**: Show only overdue items
    - **open_only**: Show only open (non-resolved) items
    """
    offset = (page - 1) * page_size

    items, total = await action_item_repository.get_filtered(
        db,
        study_id=study_id,
        status=status,
        category=category,
        severity=severity,
        assigned_to=assigned_to,
        overdue_only=overdue,
        open_only=open_only,
        skip=offset,
        limit=page_size,
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ActionItemList(
        items=[build_action_item_response(item, include_relations=True) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/stats", response_model=ActionItemStats)
async def get_action_item_stats(
    db: DbSession,
    current_user: ActiveUser,
    study_id: UUID | None = Query(None, description="Filter by study"),
) -> ActionItemStats:
    """
    Get aggregated statistics for action items.

    Returns counts by status, category, severity, SLA compliance, and resolution time.
    """
    stats = await action_item_repository.get_stats(db, study_id=study_id)
    return ActionItemStats(**stats)


@router.get("/{item_id}", response_model=ActionItemResponse)
async def get_action_item(
    item_id: UUID,
    db: DbSession,
    current_user: ActiveUser,
) -> ActionItemResponse:
    """
    Get a specific action item with full details.

    Includes audit trail (updates history).
    """
    item = await action_item_repository.get_with_relations(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )

    return build_action_item_response(item, include_relations=True)


@router.post("", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
async def create_action_item(
    item_in: ActionItemCreate,
    db: DbSession,
    current_user: CoordinatorUser,
) -> ActionItemResponse:
    """
    Create a new action item.

    Requires coordinator role or higher.
    SLA deadline is automatically calculated based on severity and category.
    """
    # Verify study exists
    study_result = await db.execute(select(Study).where(Study.id == item_in.study_id))
    if not study_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )

    # Verify assignee exists if provided
    if item_in.assigned_to:
        assignee_result = await db.execute(select(User).where(User.id == item_in.assigned_to))
        if not assignee_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found",
            )

    # Get SLA rule for this category/severity
    sla_result = await db.execute(
        select(SLARule)
        .where(
            SLARule.is_active == True,
            SLARule.severity == item_in.severity,
            (SLARule.category == item_in.category) | (SLARule.category.is_(None)),
        )
        .order_by(SLARule.category.desc().nullslast())  # Prefer specific category rule
        .limit(1)
    )
    sla_rule = sla_result.scalar_one_or_none()

    # Calculate SLA deadline
    now = datetime.now(timezone.utc)
    resolution_hours = sla_rule.resolution_hours if sla_rule else None
    sla_deadline = sla_engine.calculate_sla_deadline(now, item_in.severity, resolution_hours)

    # Create action item
    item = ActionItem(
        **item_in.model_dump(),
        created_by=current_user.id,
        sla_deadline=sla_deadline,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    # Add creation audit entry
    await action_item_repository.add_update(
        db,
        action_item_id=item.id,
        user_id=current_user.id,
        comment="Action item created",
    )

    return build_action_item_response(item)


@router.put("/{item_id}", response_model=ActionItemResponse)
async def update_action_item(
    item_id: UUID,
    item_in: ActionItemUpdate,
    db: DbSession,
    current_user: CoordinatorUser,
) -> ActionItemResponse:
    """
    Update an action item.

    Requires coordinator role or higher.
    All changes are logged in the audit trail.
    """
    item = await action_item_repository.get_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )

    # Track changes for audit trail
    update_data = item_in.model_dump(exclude_unset=True, exclude={"comment"})

    for field, new_value in update_data.items():
        old_value = getattr(item, field)

        # Skip if value hasn't changed
        if old_value == new_value:
            continue

        # Handle special cases
        if hasattr(old_value, "value"):  # Enum
            old_value = old_value.value
        if hasattr(new_value, "value"):  # Enum
            new_value_str = new_value.value
        else:
            new_value_str = str(new_value) if new_value is not None else None

        # Log the change
        await action_item_repository.add_update(
            db,
            action_item_id=item_id,
            user_id=current_user.id,
            field_changed=field,
            old_value=str(old_value) if old_value is not None else None,
            new_value=new_value_str,
            comment=item_in.comment,
        )

        # Apply the change
        setattr(item, field, new_value)

    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == ActionItemStatus.DONE:
            item.resolved_at = datetime.now(timezone.utc)
        elif new_status == ActionItemStatus.VERIFIED:
            item.verified_at = datetime.now(timezone.utc)
            item.verified_by = current_user.id

    # Recalculate escalation level
    item.escalation_level = sla_engine.get_escalation_level(item)

    await db.flush()
    await db.refresh(item)

    # Reload with relations
    item = await action_item_repository.get_with_relations(db, item_id)
    return build_action_item_response(item, include_relations=True)


@router.patch("/{item_id}/status", response_model=ActionItemResponse)
async def update_action_item_status(
    item_id: UUID,
    status_update: ActionItemStatusUpdate,
    db: DbSession,
    current_user: ActiveUser,  # Any active user can update status
) -> ActionItemResponse:
    """
    Quick status update for an action item.

    Any active user can update status.
    Use this for quick workflow transitions.
    """
    item = await action_item_repository.get_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )

    old_status = item.status

    # Validate status transition
    valid_transitions = {
        ActionItemStatus.NEW: [ActionItemStatus.IN_PROGRESS, ActionItemStatus.WAITING_EXTERNAL],
        ActionItemStatus.IN_PROGRESS: [ActionItemStatus.WAITING_EXTERNAL, ActionItemStatus.DONE, ActionItemStatus.NEW],
        ActionItemStatus.WAITING_EXTERNAL: [ActionItemStatus.IN_PROGRESS, ActionItemStatus.DONE],
        ActionItemStatus.DONE: [ActionItemStatus.VERIFIED, ActionItemStatus.IN_PROGRESS],
        ActionItemStatus.VERIFIED: [],  # Cannot transition from verified
    }

    if status_update.status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from {old_status.value} to {status_update.status.value}",
        )

    # Log the change
    await action_item_repository.add_update(
        db,
        action_item_id=item_id,
        user_id=current_user.id,
        field_changed="status",
        old_value=old_status.value,
        new_value=status_update.status.value,
        comment=status_update.comment,
    )

    # Apply changes
    item.status = status_update.status

    if status_update.status == ActionItemStatus.DONE:
        item.resolved_at = datetime.now(timezone.utc)
    elif status_update.status == ActionItemStatus.VERIFIED:
        item.verified_at = datetime.now(timezone.utc)
        item.verified_by = current_user.id

    # Recalculate escalation level
    item.escalation_level = sla_engine.get_escalation_level(item)

    await db.flush()
    await db.refresh(item)

    return build_action_item_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_action_item(
    item_id: UUID,
    db: DbSession,
    current_user: CoordinatorUser,
) -> None:
    """
    Delete an action item.

    Requires coordinator role or higher.
    Only new items can be deleted.
    """
    item = await action_item_repository.get_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )

    if item.status != ActionItemStatus.NEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only new action items can be deleted",
        )

    await db.delete(item)
    await db.flush()
