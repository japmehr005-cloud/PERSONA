"""
Financial simulation logic for investment, purchase, and security endpoints.
All calculations are in helper functions for clarity and testability.
"""

import math

# Annual return rates by risk level
ANNUAL_RETURNS = {"low": 0.06, "moderate": 0.10, "high": 0.15}
INFLATION_RATE = 0.05
MONTHLY_SAVINGS_RATIO = 0.2  # Assume 20% of income is saved


def simulate_investment(
    sip_amount: float,
    risk_level: str,
    duration_years: float,
    current_balance: float,
) -> dict:
    """
    Future value of SIP + current balance, with inflation adjustment.
    r = monthly return, n = number of months.
    FV_sip = sipAmount * (((1+r)^n - 1) / r)
    FV_balance = currentBalance * (1+r)^n
    """
    level = risk_level.lower() if isinstance(risk_level, str) else "moderate"
    annual_return = ANNUAL_RETURNS.get(level, 0.10)
    r = annual_return / 12
    n = duration_years * 12

    if r <= 0:
        fv_sip = sip_amount * n
    else:
        fv_sip = sip_amount * ((1 + r) ** n - 1) / r

    fv_balance = current_balance * (1 + r) ** n
    projected_value = fv_sip + fv_balance
    total_invested = sip_amount * n + current_balance
    profit = projected_value - total_invested

    real_adjusted_value = projected_value / ((1 + INFLATION_RATE) ** duration_years)
    expected_return_rate = annual_return

    return {
        "totalInvested": round(total_invested, 2),
        "projectedValue": round(projected_value, 2),
        "realAdjustedValue": round(real_adjusted_value, 2),
        "profit": round(profit, 2),
        "expectedReturnRate": round(expected_return_rate, 4),
    }


def simulate_purchase(
    purchase_amount: float,
    balance: float,
    monthly_income: float,
    goal_amount: float,
) -> dict:
    """
    Impact of a purchase: updated balance, % of income, goal delay, impact score.
    """
    updated_balance = balance - purchase_amount
    percentage_of_income = (purchase_amount / monthly_income * 100) if monthly_income > 0 else 0
    monthly_savings = monthly_income * MONTHLY_SAVINGS_RATIO
    goal_delay_months = (purchase_amount / monthly_savings) if monthly_savings > 0 else 0

    score = 100.0
    score -= percentage_of_income * 0.5
    score -= goal_delay_months * 2
    financial_impact_score = max(0, min(100, round(score, 1)))

    if financial_impact_score > 75:
        warning_level = "Low"
    elif financial_impact_score >= 50:
        warning_level = "Medium"
    else:
        warning_level = "High"

    return {
        "updatedBalance": round(updated_balance, 2),
        "percentageOfIncome": round(percentage_of_income, 2),
        "goalDelayMonths": round(goal_delay_months, 1),
        "financialImpactScore": financial_impact_score,
        "warningLevel": warning_level,
    }


def simulate_security(
    device_trusted: bool,
    two_factor_enabled: bool,
    unusual_alerts: bool,
    investment_size: float,
    rapid_actions: bool,
) -> dict:
    """
    Risk score from security settings; 0–40 Secure, 40–70 Elevated, 70–100 High Risk.
    """
    risk_score = 50.0
    if not device_trusted:
        risk_score += 15
    if not two_factor_enabled:
        risk_score += 20
    if not unusual_alerts:
        risk_score += 10
    if rapid_actions:
        risk_score += 15
    if investment_size > 50000:
        risk_score += 10
    risk_score = max(0, min(100, round(risk_score, 1)))

    if risk_score <= 40:
        risk_level = "Secure"
        recommendation = (
            "Your security settings look good. Keep device trust and alerts enabled "
            "and consider enabling two-factor authentication for extra protection."
        )
    elif risk_score <= 70:
        risk_level = "Elevated"
        recommendation = (
            "We recommend enabling two-factor authentication and unusual transaction alerts. "
            "Mark this device as trusted if it is yours to reduce risk flags."
        )
    else:
        risk_level = "High Risk"
        recommendation = (
            "Your current settings indicate higher risk. Enable two-factor authentication, "
            "turn on all transaction alerts, and use only trusted devices. "
            "Avoid rapid successive actions and large single transactions until settings are updated."
        )

    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "recommendation": recommendation,
    }


def portfolio_summary(investments: list) -> dict:
    """
    Aggregate portfolio from list of SIPs.
    Each item: { sipAmount, riskLevel, durationYears, projectedValue? }
    """
    if not investments:
        return {
            "totalPortfolioValue": 0.0,
            "totalInvested": 0.0,
            "totalReturns": 0.0,
            "monthlyGrowthPercentage": 0.0,
            "allocation": {"low": 0, "moderate": 0, "high": 0},
        }

    total_portfolio_value = 0.0
    total_invested = 0.0
    sip_by_risk = {"low": 0.0, "moderate": 0.0, "high": 0.0}

    for inv in investments:
        sip = float(inv.get("sipAmount") or 0)
        years = float(inv.get("durationYears") or 0)
        proj = float(inv.get("projectedValue") or 0)
        risk = (inv.get("riskLevel") or "moderate").lower()
        if risk not in sip_by_risk:
            risk = "moderate"

        total_portfolio_value += proj
        # Total invested = total contributions (sip * months)
        months = max(0, years * 12)
        total_invested += sip * months
        sip_by_risk[risk] = sip_by_risk.get(risk, 0) + sip

    total_returns = total_portfolio_value - total_invested
    total_sip = sum(sip_by_risk.values())
    if total_sip > 0:
        allocation = {
            k: round(100 * v / total_sip, 1) for k, v in sip_by_risk.items()
        }
    else:
        allocation = {k: 0 for k in sip_by_risk}

    if total_invested > 0:
        # Approximate monthly growth: (returns / invested) spread over 12 months
        monthly_growth_percentage = (total_returns / total_invested) * 100 / 12
    else:
        monthly_growth_percentage = 0.0

    return {
        "totalPortfolioValue": round(total_portfolio_value, 2),
        "totalInvested": round(total_invested, 2),
        "totalReturns": round(total_returns, 2),
        "monthlyGrowthPercentage": round(monthly_growth_percentage, 2),
        "allocation": allocation,
    }
