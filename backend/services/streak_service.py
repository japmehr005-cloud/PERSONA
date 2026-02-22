"""
Streak and badges – reactive to investments. Backend-owned.

Streak: +1 month if user invested at least once in that calendar month.
Reset if no investment in a full calendar month.

Points:
+10 per investment
+5 per on-time monthly investment (invested in that month)
+20 for hitting savings target in a month

Badges (unlock dynamically, persist in backend):
- First Investment
- 3 Month Consistency
- 6 Month Discipline
- 1 Year Investor
- Goal Achiever
- ₹1L Invested Milestone
"""

from datetime import datetime
from collections import defaultdict
from models.user_models import User, Investment, Transaction, StreakData

POINTS_PER_INVESTMENT = 10
POINTS_ON_TIME_MONTHLY = 5
POINTS_SAVINGS_TARGET = 20
MILESTONE_1L = 100_000

BADGES = [
    ("first_investment", "First Investment", lambda s, u: s.months_active >= 1 and len(u.investments) >= 1),
    ("3_month", "3 Month Consistency", lambda s, u: s.months_active >= 3),
    ("6_month", "6 Month Discipline", lambda s, u: s.months_active >= 6),
    ("1_year", "1 Year Investor", lambda s, u: s.months_active >= 12),
    ("goal_achiever", "Goal Achiever", lambda s, u: u.financial_goal > 0 and (u.balance + _portfolio_value(u)) >= u.financial_goal),
    ("1l_milestone", "₹1L Invested Milestone", lambda s, u: _total_invested(u) >= MILESTONE_1L),
]


def _total_invested(user: User) -> float:
    return sum(getattr(i, "total_invested", getattr(i, "totalInvested", 0)) or 0 for i in user.investments)


def _portfolio_value(user: User) -> float:
    return sum(getattr(i, "current_value", getattr(i, "currentValue", 0)) or 0 for i in user.investments)


def _investment_months(user: User) -> set[str]:
    """Set of 'YYYY-MM' where user had at least one investment."""
    months = set()
    for inv in user.investments:
        start = getattr(inv, "start_date", getattr(inv, "startDate", "")) or ""
        if start:
            try:
                dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                months.add(dt.strftime("%Y-%m"))
            except (ValueError, TypeError):
                pass
    for tx in user.transactions:
        if getattr(tx, "type", None) == "investment":
            date = getattr(tx, "date", "") or ""
            if date:
                try:
                    dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
                    months.add(dt.strftime("%Y-%m"))
                except (ValueError, TypeError):
                    pass
    return months


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def _last_investment_ym(user: User) -> str | None:
    """Latest YYYY-MM from investments (start_date) or investment transactions."""
    best = None
    for inv in user.investments:
        start = getattr(inv, "start_date", getattr(inv, "startDate", "")) or ""
        if start:
            try:
                dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                ym = dt.strftime("%Y-%m")
                if best is None or ym > best:
                    best = ym
            except (ValueError, TypeError):
                pass
    for tx in user.transactions:
        if getattr(tx, "type", None) == "investment":
            date = getattr(tx, "date", "") or ""
            if date:
                try:
                    dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
                    ym = dt.strftime("%Y-%m")
                    if best is None or ym > best:
                        best = ym
                except (ValueError, TypeError):
                    pass
    return best


def recompute_streak(user: User) -> StreakData:
    """
    Recompute streak from investment history.
    Consecutive months with at least one investment = streak.
    """
    inv_months = sorted(_investment_months(user))
    if not inv_months:
        return StreakData(
            months_active=0,
            last_investment_date=user.streak.last_investment_date if user.streak else None,
            points=user.streak.points if user.streak else 0,
            badges=user.streak.badges if user.streak else [],
        )

    current = _current_month()
    last_ym = inv_months[-1]

    # Count consecutive months from most recent backwards
    streak_months = 0
    check = current
    while check >= inv_months[0]:
        if check in inv_months:
            streak_months += 1
            # go to previous month
            y, m = int(check[:4]), int(check[5:7])
            m -= 1
            if m < 1:
                m += 12
                y -= 1
            check = f"{y:04d}-{m:02d}"
        else:
            break

    # Points: keep existing and add any new logic on next investment
    points = user.streak.points if user.streak else 0

    # Badges
    badge_ids = list(user.streak.badges) if user.streak else []
    streak_data = StreakData(
        months_active=streak_months,
        last_investment_date=last_ym,
        points=points,
        badges=badge_ids,
    )
    for bid, bname, condition in BADGES:
        if bid not in badge_ids and condition(streak_data, user):
            badge_ids.append(bid)

    streak_data.badges = badge_ids
    return streak_data


def add_points_for_investment(user: User, hit_savings_target: bool) -> int:
    """Add points for this investment; return points added."""
    added = POINTS_PER_INVESTMENT
    current_ym = _current_month()
    last_inv = _last_investment_ym(user)
    if last_inv == current_ym:
        added += POINTS_ON_TIME_MONTHLY
    if hit_savings_target:
        added += POINTS_SAVINGS_TARGET
    return added
