"""Dashboard routes for CTMS IDOR."""

from fastapi import APIRouter, Query

from app.api.deps import ActiveUser, DbSession
from app.repositories.action_item_repository import action_item_repository
from app.schemas.action_item import BurndownDataPoint, DashboardKPIs, ParetoItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: DbSession,
    current_user: ActiveUser,
) -> DashboardKPIs:
    """
    Get main dashboard KPIs.

    Returns:
    - **overdue_count**: Number of overdue action items
    - **aging_p90_days**: 90th percentile of item age in days
    - **total_items**: Total open action items
    - **sla_compliance_pct**: Percentage of items resolved within SLA
    - **items_by_severity**: Count of open items by severity level
    - **items_created_last_7_days**: Items created in the last week
    - **items_resolved_last_7_days**: Items resolved in the last week
    """
    kpis = await action_item_repository.get_kpis(db)
    return DashboardKPIs(**kpis)


@router.get("/burndown", response_model=list[BurndownDataPoint])
async def get_burndown_data(
    db: DbSession,
    current_user: ActiveUser,
    days: int = Query(30, ge=7, le=90, description="Number of days to include"),
) -> list[BurndownDataPoint]:
    """
    Get burndown chart data.

    Returns daily data for open/closed items over the specified period.

    - **days**: Number of days to include (7-90)
    """
    data = await action_item_repository.get_burndown_data(db, days=days)
    return [BurndownDataPoint(**point) for point in data]


@router.get("/pareto", response_model=list[ParetoItem])
async def get_pareto_data(
    db: DbSession,
    current_user: ActiveUser,
    top_n: int = Query(5, ge=3, le=10, description="Number of top categories"),
) -> list[ParetoItem]:
    """
    Get Pareto chart data (top categories by count).

    Returns the top categories with their counts and percentages.

    - **top_n**: Number of top categories to return (3-10)
    """
    data = await action_item_repository.get_pareto_data(db, top_n=top_n)
    return [ParetoItem(**item) for item in data]
