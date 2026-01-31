"""SLA calculation engine for CTMS IDOR with Brazilian business days."""

from datetime import date, datetime, timedelta, timezone
from typing import TYPE_CHECKING

from dateutil.easter import easter

if TYPE_CHECKING:
    from app.models.action_item import ActionItem, SeverityLevel


class SLAEngine:
    """Engine for SLA calculations with Brazilian business days."""

    # Default SLA hours by severity (if no rule found in database)
    DEFAULT_SLA_HOURS: dict[str, int] = {
        "critical": 48,
        "major": 40,
        "minor": 80,
        "info": 120,
    }

    # Default escalation hours by severity
    DEFAULT_ESCALATION_HOURS: dict[str, int] = {
        "critical": 24,
        "major": 20,
        "minor": 40,
        "info": 80,
    }

    def __init__(self) -> None:
        self._holiday_cache: dict[int, set[date]] = {}

    def get_brazilian_holidays(self, year: int) -> set[date]:
        """
        Get Brazilian national holidays for a given year.

        Includes fixed holidays and movable holidays (Easter-based).
        """
        if year in self._holiday_cache:
            return self._holiday_cache[year]

        # Fixed holidays
        holidays = {
            date(year, 1, 1),    # Confraternizacao Universal
            date(year, 4, 21),   # Tiradentes
            date(year, 5, 1),    # Dia do Trabalho
            date(year, 9, 7),    # Independencia
            date(year, 10, 12),  # Nossa Senhora Aparecida
            date(year, 11, 2),   # Finados
            date(year, 11, 15),  # Proclamacao da Republica
            date(year, 12, 25),  # Natal
        }

        # Movable holidays (Easter-based)
        easter_date = easter(year)
        holidays.add(easter_date - timedelta(days=47))  # Carnaval (segunda)
        holidays.add(easter_date - timedelta(days=46))  # Carnaval (terca)
        holidays.add(easter_date - timedelta(days=2))   # Sexta-feira Santa
        holidays.add(easter_date)                        # Pascoa
        holidays.add(easter_date + timedelta(days=60))  # Corpus Christi

        self._holiday_cache[year] = holidays
        return holidays

    def is_business_day(self, d: date) -> bool:
        """Check if a date is a business day in Brazil."""
        # Weekend check
        if d.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False

        # Holiday check
        holidays = self.get_brazilian_holidays(d.year)
        return d not in holidays

    def add_business_hours(
        self,
        start: datetime,
        hours: int,
        business_hours_per_day: int = 8,
    ) -> datetime:
        """
        Add business hours to a datetime, respecting Brazilian holidays.

        Assumes business hours are 08:00-17:00 (with 1h lunch).
        For simplicity, we convert hours to full business days and add them.
        """
        full_days = hours // business_hours_per_day
        remaining_hours = hours % business_hours_per_day

        current_date = start.date()
        days_added = 0

        # Add full business days
        while days_added < full_days:
            current_date += timedelta(days=1)
            if self.is_business_day(current_date):
                days_added += 1

        # Add remaining hours to the final business day
        result = datetime(
            year=current_date.year,
            month=current_date.month,
            day=current_date.day,
            hour=start.hour,
            minute=start.minute,
            second=start.second,
            tzinfo=start.tzinfo,
        ) + timedelta(hours=remaining_hours)

        # If remaining hours push us to next day, adjust
        if result.date() > current_date:
            # Find next business day
            next_day = result.date()
            while not self.is_business_day(next_day):
                next_day += timedelta(days=1)
            result = datetime(
                year=next_day.year,
                month=next_day.month,
                day=next_day.day,
                hour=8,  # Start of business day
                minute=0,
                second=0,
                tzinfo=start.tzinfo,
            )

        return result

    def calculate_sla_deadline(
        self,
        created_at: datetime,
        severity: "SeverityLevel",
        resolution_hours: int | None = None,
    ) -> datetime:
        """
        Calculate SLA deadline based on severity and creation time.

        Args:
            created_at: When the action item was created
            severity: Severity level of the action item
            resolution_hours: Override for resolution hours (from SLA rule)

        Returns:
            datetime: The SLA deadline
        """
        hours = resolution_hours or self.DEFAULT_SLA_HOURS.get(severity.value, 80)

        # Ensure timezone awareness
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return self.add_business_hours(created_at, hours)

    def is_overdue(self, action_item: "ActionItem") -> bool:
        """Check if an action item is past its SLA deadline."""
        if not action_item.sla_deadline:
            return False

        # Only check open items
        if not action_item.is_open:
            return False

        now = datetime.now(timezone.utc)
        deadline = action_item.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        return now > deadline

    def get_escalation_level(
        self,
        action_item: "ActionItem",
        escalation_hours: int | None = None,
    ) -> int:
        """
        Calculate current escalation level for an action item.

        Level 0: Not yet at escalation threshold
        Level 1: Past first escalation threshold
        Level 2: Past SLA deadline (overdue)
        Level 3+: Additional escalations (one per additional period past deadline)
        """
        if not action_item.sla_deadline or not action_item.is_open:
            return 0

        hours = escalation_hours or self.DEFAULT_ESCALATION_HOURS.get(
            action_item.severity.value, 40
        )

        now = datetime.now(timezone.utc)
        created = action_item.created_at
        deadline = action_item.sla_deadline

        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        # Time elapsed since creation
        elapsed = (now - created).total_seconds() / 3600  # hours

        # Check escalation levels
        if now > deadline:
            # Past deadline - level 2 or higher
            overdue_hours = (now - deadline).total_seconds() / 3600
            additional_levels = int(overdue_hours // hours)
            return 2 + additional_levels
        elif elapsed >= hours:
            # Past escalation threshold but not deadline
            return 1

        return 0

    def days_until_deadline(self, action_item: "ActionItem") -> float | None:
        """
        Calculate days (including fractional) until SLA deadline.

        Returns negative value if overdue.
        Returns None if no deadline set or item is closed.
        """
        if not action_item.sla_deadline or not action_item.is_open:
            return None

        now = datetime.now(timezone.utc)
        deadline = action_item.sla_deadline

        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        delta = deadline - now
        return delta.total_seconds() / 86400  # Convert to days

    def business_days_between(self, start: date, end: date) -> int:
        """Count business days between two dates."""
        if start > end:
            start, end = end, start

        count = 0
        current = start
        while current <= end:
            if self.is_business_day(current):
                count += 1
            current += timedelta(days=1)

        return count


# Singleton instance
sla_engine = SLAEngine()
