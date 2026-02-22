"""
Financial math – SIP, goal timeline, savings rate.
Backend is source of truth. No frontend duplication.

SIP future value: FV = SIP * [((1+r)^n - 1) / r] * (1+r)
where r = monthly rate, n = number of months.
(Standard FV of annuity due – payment at start of period.)
"""

import math
from datetime import datetime

# Expected annual returns by risk (user spec)
EXPECTED_RETURN = {"low": 0.06, "moderate": 0.12, "high": 0.18}


def monthly_rate(annual_return: float) -> float:
    return annual_return / 12.0


def sip_future_value(sip_amount: float, annual_return: float, months: float) -> float:
    """
    FV of SIP: SIP * [((1+r)^n - 1) / r] * (1+r)
    """
    if months <= 0:
        return 0.0
    r = monthly_rate(annual_return)
    if r <= 0:
        return sip_amount * months
    n = months
    fv = sip_amount * (((1 + r) ** n - 1) / r) * (1 + r)
    return round(fv, 2)


def sip_total_invested(sip_amount: float, months: float) -> float:
    return round(sip_amount * months, 2)


def months_elapsed(start_date_iso: str, end_date_iso: str | None = None) -> float:
    """Months between start and end (or now)."""
    try:
        start = datetime.fromisoformat(start_date_iso.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        start = datetime.utcnow()
    if end_date_iso:
        try:
            end = datetime.fromisoformat(end_date_iso.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            end = datetime.utcnow()
    else:
        end = datetime.utcnow()
    delta = end - start
    return max(0, delta.days / 30.44)  # approx month length


def investment_current_value(
    sip_amount: float,
    annual_return: float,
    start_date_iso: str,
    duration_years: float,
) -> tuple[float, float, float]:
    """
    Returns (total_invested, current_value, projected_value_at_end).
    """
    months_total = duration_years * 12
    months_so_far = min(months_elapsed(start_date_iso), months_total)
    total_invested = sip_total_invested(sip_amount, months_so_far)
    current_value = sip_future_value(sip_amount, annual_return, months_so_far)
    projected_value = sip_future_value(sip_amount, annual_return, months_total)
    return (
        round(total_invested, 2),
        round(current_value, 2),
        round(projected_value, 2),
    )


def get_expected_return(risk_level: str) -> float:
    r = (risk_level or "moderate").lower()
    return EXPECTED_RETURN.get(r, EXPECTED_RETURN["moderate"])


def savings_rate(income: float, expenses: float) -> float:
    if income <= 0:
        return 0.0
    return round(100.0 * max(0, income - expenses) / income, 1)


def goal_progress(current_savings: float, goal: float) -> float:
    if goal <= 0:
        return 100.0
    return round(100.0 * min(1.0, current_savings / goal), 1)


def months_to_goal(
    current_savings: float,
    goal: float,
    monthly_savings: float,
) -> float:
    if goal <= current_savings:
        return 0.0
    if monthly_savings <= 0:
        return 999.0
    return round((goal - current_savings) / monthly_savings, 1)


def portfolio_totals(investments: list) -> tuple[float, float, float]:
    """total_invested, current_value, total_returns."""
    total_invested = 0.0
    current_value = 0.0
    for inv in investments:
        ti = getattr(inv, "total_invested", None) or getattr(inv, "totalInvested", None) or (inv.get("totalInvested", 0) if isinstance(inv, dict) else 0)
        cv = getattr(inv, "current_value", None) or getattr(inv, "currentValue", None) or (inv.get("currentValue", 0) if isinstance(inv, dict) else 0)
        total_invested += ti or 0
        current_value += cv or 0
    return (round(total_invested, 2), round(current_value, 2), round(current_value - total_invested, 2))


def refresh_investment_values(investment_list: list) -> list:
    """
    Update each investment's total_invested, current_value, projected_value.
    Mutates in place and returns the list.
    """
    for inv in investment_list:
        sip = getattr(inv, "sip_amount", None) or getattr(inv, "sipAmount", 0) or 0
        ann = getattr(inv, "expected_annual_return", None) or getattr(inv, "expectedAnnualReturn", 0) or 0
        start = getattr(inv, "start_date", None) or getattr(inv, "startDate", "") or ""
        dur = getattr(inv, "duration_years", None) or getattr(inv, "durationYears", 0) or 0
        if not start or dur <= 0:
            continue
        ti, cv, pv = investment_current_value(sip, ann, start, dur)
        setattr(inv, "total_invested", ti)
        setattr(inv, "current_value", cv)
        setattr(inv, "projected_value", pv)
    return investment_list
