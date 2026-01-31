"""Study routes for CTMS IDOR."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import ActiveUser, CoordinatorUser, DbSession, ManagerUser
from app.models.action_item import ActionItem, ActionItemStatus
from app.models.study import Study, StudyStatus
from app.schemas.study import StudyCreate, StudyList, StudyResponse, StudyUpdate

router = APIRouter(prefix="/studies", tags=["Studies"])


@router.get("", response_model=StudyList)
async def list_studies(
    db: DbSession,
    current_user: ActiveUser,
    status: StudyStatus | None = Query(None, description="Filter by status"),
    sponsor: str | None = Query(None, description="Filter by sponsor"),
    search: str | None = Query(None, description="Search in protocol number or short name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> StudyList:
    """
    List all studies with optional filters and pagination.

    - **status**: Filter by study status
    - **sponsor**: Filter by sponsor name
    - **search**: Search in protocol number or short name
    - **page**: Page number (starts at 1)
    - **page_size**: Number of items per page (max 100)
    """
    # Build query
    query = select(Study)
    count_query = select(func.count()).select_from(Study)

    # Apply filters
    if status:
        query = query.where(Study.status == status)
        count_query = count_query.where(Study.status == status)

    if sponsor:
        query = query.where(Study.sponsor.ilike(f"%{sponsor}%"))
        count_query = count_query.where(Study.sponsor.ilike(f"%{sponsor}%"))

    if search:
        search_filter = (
            Study.protocol_number.ilike(f"%{search}%") |
            Study.short_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Study.short_name).offset(offset).limit(page_size)

    # Execute query
    result = await db.execute(query)
    studies = list(result.scalars().all())

    # Calculate pages
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    # Add action item counts
    study_responses = []
    for study in studies:
        # Get action item counts for this study
        total_items_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(ActionItem.study_id == study.id)
        )
        total_items = total_items_result.scalar() or 0

        open_items_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                ActionItem.study_id == study.id,
                ActionItem.status.notin_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
            )
        )
        open_items = open_items_result.scalar() or 0

        response = StudyResponse.model_validate(study)
        response.action_items_count = total_items
        response.open_action_items_count = open_items
        response.enrollment_percentage = study.enrollment_percentage
        study_responses.append(response)

    return StudyList(
        items=study_responses,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{study_id}", response_model=StudyResponse)
async def get_study(
    study_id: UUID,
    db: DbSession,
    current_user: ActiveUser,
) -> Study:
    """
    Get a specific study by ID.

    Returns study details with action item counts.
    """
    result = await db.execute(
        select(Study).where(Study.id == study_id)
    )
    study = result.scalar_one_or_none()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )

    return study


@router.post("", response_model=StudyResponse, status_code=status.HTTP_201_CREATED)
async def create_study(
    study_in: StudyCreate,
    db: DbSession,
    current_user: ManagerUser,  # Only managers can create studies
) -> Study:
    """
    Create a new study.

    Requires manager role or higher.

    - **protocol_number**: Unique protocol number
    - **short_name**: Short display name
    - **full_title**: Complete study title
    - **sponsor**: Sponsoring organization
    """
    # Check if protocol number already exists
    result = await db.execute(
        select(Study).where(Study.protocol_number == study_in.protocol_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Protocol number already exists",
        )

    # Create study
    study = Study(**study_in.model_dump())
    db.add(study)
    await db.flush()
    await db.refresh(study)

    return study


@router.put("/{study_id}", response_model=StudyResponse)
async def update_study(
    study_id: UUID,
    study_in: StudyUpdate,
    db: DbSession,
    current_user: CoordinatorUser,  # Coordinators and above can update
) -> Study:
    """
    Update an existing study.

    Requires coordinator role or higher.
    Only provided fields will be updated.
    """
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )

    # Check for protocol number uniqueness if being changed
    if study_in.protocol_number and study_in.protocol_number != study.protocol_number:
        existing = await db.execute(
            select(Study).where(Study.protocol_number == study_in.protocol_number)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Protocol number already exists",
            )

    # Update fields
    update_data = study_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(study, field, value)

    await db.flush()
    await db.refresh(study)

    return study


@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study(
    study_id: UUID,
    db: DbSession,
    current_user: ManagerUser,  # Only managers can delete
) -> None:
    """
    Soft delete a study by setting status to closed.

    Requires manager role or higher.
    Studies with active action items cannot be deleted.
    """
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )

    # Check for open action items
    open_items_result = await db.execute(
        select(func.count())
        .select_from(ActionItem)
        .where(
            ActionItem.study_id == study_id,
            ActionItem.status.notin_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
        )
    )
    open_items = open_items_result.scalar() or 0

    if open_items > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete study with {open_items} open action items",
        )

    # Soft delete by setting status to closed
    study.status = StudyStatus.CLOSED
    await db.flush()
