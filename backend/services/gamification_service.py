"""
Behavioral Reinforcement Layer – Gamification.

- Savings streak (months of healthy savings)
- Streak-at-risk when current action could break the streak
- XP and badges
- Habit reinforcement suggestions
"""

from models.schemas import (
    WealthInputs,
    WealthAnalysis,
    GamificationResponse,
)


# XP for positive behaviors
XP_SAVINGS_ACTION = 10
XP_GOAL_PROGRESS = 5
XP_STREAK_MONTH = 15

# Badge thresholds (months of streak)
BADGES = [
    (1, "First Step"),
    (3, "Consistent Saver"),
    (5, "Five-Month Streak"),
    (6, "Half-Year Hero"),
    (12, "Year-Long Champion"),
]


def compute_gamification(
    wealth_inputs: WealthInputs,
    wealth_analysis: WealthAnalysis,
    current_streak_months: int = 0,
    total_xp: int = 0,
) -> GamificationResponse:
    """
    Compute streak, streak-at-risk, XP, badges, and habit suggestion.

    Streak at risk: if surplus would go negative or investment is large vs savings,
    we warn that the streak could break.
    """
    # This action's impact: if they're still saving after this, streak can continue
    surplus_after = wealth_analysis.surplus
    savings_rate_healthy = (
        wealth_inputs.monthly_savings / wealth_inputs.monthly_income
        if wealth_inputs.monthly_income > 0
        else 0
    )

    # Streak continues if surplus >= 0 and they maintained a "healthy" savings rate (e.g. >10%)
    maintains_savings = surplus_after >= -0.01 and savings_rate_healthy >= 0.1
    streak_at_risk = not maintains_savings and current_streak_months > 0

    # New streak = current + 1 if this month is good, else 0
    if maintains_savings:
        savings_streak_months = current_streak_months + 1
    else:
        savings_streak_months = 0

    # XP this action
    xp_earned = 0
    if maintains_savings:
        xp_earned += XP_SAVINGS_ACTION
    if wealth_analysis.months_to_goal < 600 and wealth_analysis.confidence_level >= 0.6:
        xp_earned += XP_GOAL_PROGRESS
    if savings_streak_months > current_streak_months and savings_streak_months > 0:
        xp_earned += XP_STREAK_MONTH

    new_total_xp = total_xp + xp_earned

    # Badges earned so far (based on current streak after this action)
    badges = []
    for months, name in BADGES:
        if savings_streak_months >= months:
            badges.append(f"{name} ({months} mo)")

    # Habit suggestion
    if savings_streak_months >= 5:
        habit_suggestion = (
            f"You maintained a healthy savings rate for {savings_streak_months} months. "
            "Keep it up!"
        )
    elif streak_at_risk:
        habit_suggestion = "This action may break your savings streak. Consider a smaller amount or waiting."
    elif savings_streak_months == 1:
        habit_suggestion = "Great start! One month of consistent savings. Aim for three to unlock the next badge."
    else:
        habit_suggestion = "Stick to your savings plan to build your streak and earn badges."

    return GamificationResponse(
        savings_streak_months=savings_streak_months,
        streak_at_risk=streak_at_risk,
        xp_earned=xp_earned,
        badges=badges,
        habit_suggestion=habit_suggestion,
    )


class GamificationService:
    """Behavioral reinforcement. Use compute(wealth_inputs, wealth_analysis, ...) for gamification."""

    def compute(
        self,
        wealth_inputs: WealthInputs,
        wealth_analysis: WealthAnalysis,
        current_streak_months: int = 0,
        total_xp: int = 0,
    ) -> GamificationResponse:
        return compute_gamification(
            wealth_inputs,
            wealth_analysis,
            current_streak_months=current_streak_months,
            total_xp=total_xp,
        )


gamification_service = GamificationService()
