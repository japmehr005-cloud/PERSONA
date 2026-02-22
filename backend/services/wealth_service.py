"""
Wealth Intelligence Engine.

Business logic:
- Surplus = income minus implied expenses (we treat savings as given; surplus is what remains
  after accounting for the proposed action's impact on savings).
- Months to goal: compound growth simulation with configurable risk preference.
- Confidence: based on how stable the plan is (savings rate, goal realism).
- All monetary units are in same currency (no conversion).
"""

import math
from models.schemas import WealthInputs, WealthAnalysis


# ----- Financial modeling assumptions (documented) -----
# - Growth rate assumptions by risk preference (annual, applied monthly as rate^(1/12))
ANNUAL_GROWTH_RATES = {
    "conservative": 0.04,
    "moderate": 0.07,
    "aggressive": 0.10,
}
DEFAULT_GROWTH_RATE = 0.06  # fallback

# - We assume user has some baseline "expenses" = income - savings (so surplus in our terms
#   is the flexibility after the action: e.g. surplus = income - expenses - investment_amount
#   for the month, or we define surplus as (income - savings) - investment = free cash - investment).
# - Simplification: surplus = monthly_income - monthly_savings - investment_amount (for this action).
#   So surplus can be negative if they're "spending" more than (income - savings).


def _monthly_growth_rate(risk_preference: str) -> float:
    r = ANNUAL_GROWTH_RATES.get(risk_preference.lower(), DEFAULT_GROWTH_RATE)
    return (1 + r) ** (1 / 12) - 1


def compute_wealth_analysis(inputs: WealthInputs) -> WealthAnalysis:
    """
    Compute surplus, months to goal, confidence, and recommendation.

    Surplus: income - savings - investment_amount (for this action).
    Months to goal: solve for n in FV = goal, with monthly contribution (savings)
    and compound growth. Simplified: we treat current wealth as 0 and goal as target;
    months = log((goal * r + C) / C) / log(1+r) with C = monthly_savings, r = monthly rate.
    If investment_amount is a one-time deduction from savings this month, we use
    effective_savings = monthly_savings - investment_amount for that month (simplified:
    we still use monthly_savings for the projection and mention the one-time hit in recommendation).
    """
    monthly_rate = _monthly_growth_rate(inputs.risk_preference)

    # Surplus: money left after savings and this action (investment/spend)
    surplus = inputs.monthly_income - inputs.monthly_savings - inputs.investment_amount

    # Months to goal: FV of annuity: FV = C * (((1+r)^n - 1) / r). Solve for n.
    # goal = monthly_savings * (((1+r)^n - 1) / r)  =>  (1+r)^n = 1 + goal * r / monthly_savings
    if inputs.monthly_savings <= 0 or monthly_rate <= 0:
        months_to_goal = 999.0  # no growth or no savings
    else:
        # n = log(1 + goal * r / C) / log(1+r)
        try:
            n = math.log(1 + inputs.financial_goal * monthly_rate / inputs.monthly_savings) / math.log(
                1 + monthly_rate
            )
            months_to_goal = max(0.0, min(n, 600.0))  # cap at 50 years
        except (ValueError, ZeroDivisionError):
            months_to_goal = 999.0

    # Confidence: higher if savings rate is reasonable and goal is not impossible
    savings_rate = inputs.monthly_savings / inputs.monthly_income if inputs.monthly_income > 0 else 0
    goal_ratio = inputs.monthly_savings * months_to_goal / inputs.financial_goal if inputs.financial_goal > 0 else 1
    if months_to_goal <= 0 or goal_ratio <= 0:
        confidence = 0.3
    elif savings_rate >= 0.2 and months_to_goal < 360:
        confidence = 0.85
    elif savings_rate >= 0.1:
        confidence = 0.7
    else:
        confidence = 0.5

    # One-time large investment reduces confidence slightly
    if inputs.investment_amount > inputs.monthly_savings * 3:
        confidence *= 0.9

    # Recommendation message
    if surplus < 0:
        recommendation_message = (
            f"This action uses ₹{abs(surplus):,.0f} more than your current surplus. "
            "Consider reducing the amount or waiting until you have more surplus."
        )
    elif months_to_goal > 240:
        recommendation_message = (
            f"At current savings, reaching your goal may take {months_to_goal/12:.0f}+ years. "
            "Consider increasing monthly savings or adjusting your goal."
        )
    else:
        recommendation_message = (
            f"Surplus of ₹{surplus:,.0f} supports this action. "
            f"On track to goal in ~{months_to_goal:.0f} months with your current plan."
        )

    return WealthAnalysis(
        surplus=round(surplus, 2),
        months_to_goal=round(months_to_goal, 1),
        confidence_level=round(confidence, 2),
        recommendation_message=recommendation_message,
    )


class WealthService:
    """Wealth intelligence engine. Use compute(inputs) for analysis."""

    def compute(self, inputs: WealthInputs) -> WealthAnalysis:
        return compute_wealth_analysis(inputs)


wealth_service = WealthService()
