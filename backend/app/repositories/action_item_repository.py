"""Action Item repository with specialized queries."""

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.action_item import (
    ActionItem,
    ActionItemCategory,
    ActionItemStatus,
    ActionItemUpdate,
    SeverityLevel,
)
from app.repositories.base import BaseRepository
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate as ActionItemUpdateSchema


class ActionItemRepository(BaseRepository[ActionItem, ActionItemCreate, ActionItemUpdateSchema]):
    """Repository for ActionItem with specialized queries."""

    def __init__(self) -> None:
        super().__init__(ActionItem)

    async def get_with_relations(
        self,
        db: AsyncSession,
        id: UUID,
    ) -> ActionItem | None:
        """Get action item with all relations loaded."""
        result = await db.execute(
            select(ActionItem)
            .options(
                selectinload(ActionItem.study),
                selectinload(ActionItem.assignee),
                selectinload(ActionItem.creator),
                selectinload(ActionItem.verifier),
                selectinload(ActionItem.updates).selectinload(ActionItemUpdate.user),
            )
            .where(ActionItem.id == id)
        )
        return result.scalar_one_or_none()

    async def get_filtered(
        self,
        db: AsyncSession,
        *,
        study_id: UUID | None = None,
        status: ActionItemStatus | None = None,
        category: ActionItemCategory | None = None,
        severity: SeverityLevel | None = None,
        assigned_to: UUID | None = None,
        overdue_only: bool = False,
        open_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[ActionItem], int]:
        """Get filtered action items with total count."""
        # Base query
        query = select(ActionItem).options(
            selectinload(ActionItem.study),
            selectinload(ActionItem.assignee),
        )
        count_query = select(func.count()).select_from(ActionItem)

        # Apply filters
        conditions = []

        if study_id:
            conditions.append(ActionItem.study_id == study_id)

        if status:
            conditions.append(ActionItem.status == status)

        if category:
            conditions.append(ActionItem.category == category)

        if severity:
            conditions.append(ActionItem.severity == severity)

        if assigned_to:
            conditions.append(ActionItem.assigned_to == assigned_to)

        if open_only:
            conditions.append(
                ActionItem.status.notin_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED])
            )

        if overdue_only:
            now = datetime.now(timezone.utc)
            conditions.append(
                and_(
                    ActionItem.sla_deadline.isnot(None),
                    ActionItem.sla_deadline < now,
                    ActionItem.status.notin_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
                )
            )

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Apply ordering and pagination
        query = query.order_by(
            ActionItem.severity.asc(),  # Critical first
            ActionItem.sla_deadline.asc().nullslast(),
            ActionItem.created_at.desc(),
        ).offset(skip).limit(limit)

        result = await db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_stats(
        self,
        db: AsyncSession,
        *,
        study_id: UUID | None = None,
    ) -> dict[str, Any]:
        """Get aggregated statistics for action items."""
        now = datetime.now(timezone.utc)
        open_statuses = [ActionItemStatus.NEW, ActionItemStatus.IN_PROGRESS, ActionItemStatus.WAITING_EXTERNAL]

        # Base condition
        base_condition = ActionItem.study_id == study_id if study_id else True

        # Total count
        total_result = await db.execute(
            select(func.count()).select_from(ActionItem).where(base_condition)
        )
        total = total_result.scalar() or 0

        # Open count
        open_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(and_(base_condition, ActionItem.status.in_(open_statuses)))
        )
        open_count = open_result.scalar() or 0

        # Overdue count
        overdue_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    base_condition,
                    ActionItem.status.in_(open_statuses),
                    ActionItem.sla_deadline.isnot(None),
                    ActionItem.sla_deadline < now,
                )
            )
        )
        overdue_count = overdue_result.scalar() or 0

        # By status
        status_result = await db.execute(
            select(ActionItem.status, func.count())
            .where(base_condition)
            .group_by(ActionItem.status)
        )
        by_status = {str(row[0].value): row[1] for row in status_result.all()}

        # By category
        category_result = await db.execute(
            select(ActionItem.category, func.count())
            .where(base_condition)
            .group_by(ActionItem.category)
        )
        by_category = {str(row[0].value): row[1] for row in category_result.all()}

        # By severity
        severity_result = await db.execute(
            select(ActionItem.severity, func.count())
            .where(base_condition)
            .group_by(ActionItem.severity)
        )
        by_severity = {str(row[0].value): row[1] for row in severity_result.all()}

        # SLA compliance (resolved items that were resolved before deadline)
        resolved_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    base_condition,
                    ActionItem.status.in_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
                    ActionItem.sla_deadline.isnot(None),
                )
            )
        )
        total_resolved_with_sla = resolved_result.scalar() or 0

        on_time_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    base_condition,
                    ActionItem.status.in_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
                    ActionItem.sla_deadline.isnot(None),
                    ActionItem.resolved_at.isnot(None),
                    ActionItem.resolved_at <= ActionItem.sla_deadline,
                )
            )
        )
        on_time_count = on_time_result.scalar() or 0

        sla_compliance = (
            (on_time_count / total_resolved_with_sla * 100)
            if total_resolved_with_sla > 0
            else 100.0
        )

        # Average resolution time (in hours) for resolved items
        avg_result = await db.execute(
            select(
                func.avg(
                    func.extract("epoch", ActionItem.resolved_at - ActionItem.created_at) / 3600
                )
            )
            .select_from(ActionItem)
            .where(
                and_(
                    base_condition,
                    ActionItem.resolved_at.isnot(None),
                )
            )
        )
        avg_resolution_hours = avg_result.scalar()

        return {
            "total": total,
            "open": open_count,
            "overdue": overdue_count,
            "by_status": by_status,
            "by_category": by_category,
            "by_severity": by_severity,
            "sla_compliance_percentage": round(sla_compliance, 1),
            "average_resolution_hours": round(avg_resolution_hours, 1) if avg_resolution_hours else None,
        }

    async def get_kpis(
        self,
        db: AsyncSession,
    ) -> dict[str, Any]:
        """Get KPIs for dashboard."""
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        open_statuses = [ActionItemStatus.NEW, ActionItemStatus.IN_PROGRESS, ActionItemStatus.WAITING_EXTERNAL]

        # Overdue count
        overdue_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    ActionItem.status.in_(open_statuses),
                    ActionItem.sla_deadline.isnot(None),
                    ActionItem.sla_deadline < now,
                )
            )
        )
        overdue_count = overdue_result.scalar() or 0

        # Total open items
        total_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(ActionItem.status.in_(open_statuses))
        )
        total_items = total_result.scalar() or 0

        # P90 aging (days since creation for open items)
        aging_result = await db.execute(
            select(
                func.percentile_cont(0.9).within_group(
                    func.extract("epoch", now - ActionItem.created_at) / 86400
                )
            )
            .select_from(ActionItem)
            .where(ActionItem.status.in_(open_statuses))
        )
        aging_p90 = aging_result.scalar()

        # SLA compliance
        resolved_with_sla = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    ActionItem.status.in_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
                    ActionItem.sla_deadline.isnot(None),
                )
            )
        )
        total_resolved = resolved_with_sla.scalar() or 0

        on_time = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    ActionItem.status.in_([ActionItemStatus.DONE, ActionItemStatus.VERIFIED]),
                    ActionItem.sla_deadline.isnot(None),
                    ActionItem.resolved_at.isnot(None),
                    ActionItem.resolved_at <= ActionItem.sla_deadline,
                )
            )
        )
        on_time_count = on_time.scalar() or 0

        sla_compliance = (
            (on_time_count / total_resolved * 100) if total_resolved > 0 else 100.0
        )

        # By severity
        severity_result = await db.execute(
            select(ActionItem.severity, func.count())
            .where(ActionItem.status.in_(open_statuses))
            .group_by(ActionItem.severity)
        )
        by_severity = {str(row[0].value): row[1] for row in severity_result.all()}

        # Created last 7 days
        created_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(ActionItem.created_at >= seven_days_ago)
        )
        created_last_7_days = created_result.scalar() or 0

        # Resolved last 7 days
        resolved_result = await db.execute(
            select(func.count())
            .select_from(ActionItem)
            .where(
                and_(
                    ActionItem.resolved_at.isnot(None),
                    ActionItem.resolved_at >= seven_days_ago,
                )
            )
        )
        resolved_last_7_days = resolved_result.scalar() or 0

        return {
            "overdue_count": overdue_count,
            "aging_p90_days": round(aging_p90, 1) if aging_p90 else None,
            "total_items": total_items,
            "sla_compliance_pct": round(sla_compliance, 1),
            "items_by_severity": by_severity,
            "items_created_last_7_days": created_last_7_days,
            "items_resolved_last_7_days": resolved_last_7_days,
        }

    async def get_burndown_data(
        self,
        db: AsyncSession,
        *,
        days: int = 30,
    ) -> list[dict[str, Any]]:
        """Get weekly burndown data for chart."""
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # Get all items created before end of period
        items_result = await db.execute(
            select(
                ActionItem.created_at,
                ActionItem.resolved_at,
            ).where(ActionItem.created_at <= now)
        )
        items = items_result.all()

        # Calculate daily open/closed counts
        data = []
        current_date = start_date.date()
        cumulative_closed = 0

        while current_date <= now.date():
            day_start = datetime(
                current_date.year, current_date.month, current_date.day,
                tzinfo=timezone.utc
            )
            day_end = day_start + timedelta(days=1)

            # Items created by end of day
            created_by_day = sum(
                1 for item in items
                if item.created_at <= day_end
            )

            # Items resolved by end of day
            resolved_by_day = sum(
                1 for item in items
                if item.resolved_at and item.resolved_at <= day_end
            )

            # Items closed on this specific day
            closed_today = sum(
                1 for item in items
                if item.resolved_at and day_start <= item.resolved_at < day_end
            )

            cumulative_closed += closed_today

            data.append({
                "date": current_date.isoformat(),
                "open_items": created_by_day - resolved_by_day,
                "closed_items": closed_today,
                "cumulative_closed": cumulative_closed,
            })

            current_date += timedelta(days=1)

        return data

    async def get_pareto_data(
        self,
        db: AsyncSession,
        *,
        top_n: int = 5,
    ) -> list[dict[str, Any]]:
        """Get Pareto data (top categories by count)."""
        open_statuses = [ActionItemStatus.NEW, ActionItemStatus.IN_PROGRESS, ActionItemStatus.WAITING_EXTERNAL]

        # Get counts by category
        result = await db.execute(
            select(ActionItem.category, func.count().label("count"))
            .where(ActionItem.status.in_(open_statuses))
            .group_by(ActionItem.category)
            .order_by(func.count().desc())
        )
        categories = result.all()

        if not categories:
            return []

        # Calculate total and percentages
        total = sum(cat.count for cat in categories)
        data = []
        cumulative = 0.0

        for cat in categories[:top_n]:
            percentage = (cat.count / total * 100) if total > 0 else 0
            cumulative += percentage
            data.append({
                "category": cat.category.value,
                "count": cat.count,
                "percentage": round(percentage, 1),
                "cumulative_percentage": round(cumulative, 1),
            })

        return data

    async def add_update(
        self,
        db: AsyncSession,
        *,
        action_item_id: UUID,
        user_id: UUID,
        field_changed: str | None = None,
        old_value: str | None = None,
        new_value: str | None = None,
        comment: str | None = None,
    ) -> ActionItemUpdate:
        """Add an audit trail entry for an action item."""
        update = ActionItemUpdate(
            action_item_id=action_item_id,
            user_id=user_id,
            field_changed=field_changed,
            old_value=old_value,
            new_value=new_value,
            comment=comment,
        )
        db.add(update)
        await db.flush()
        await db.refresh(update)
        return update


# Singleton instance
action_item_repository = ActionItemRepository()
