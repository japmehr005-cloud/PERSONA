"""
Pydantic schemas for SecureWealth Twin API.
Request/response models and enums for wealth, risk, and gamification.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DecisionOutcome(str, Enum):
    ALLOW = "allow"
    WARN = "warn"
    BLOCK = "block"


# ---------- Request: Action to evaluate ----------


class WealthInputs(BaseModel):
    """Inputs for wealth intelligence engine."""

    monthly_income: float = Field(..., ge=0, description="Monthly income in currency units")
    monthly_savings: float = Field(..., ge=0, description="Monthly savings amount")
    investment_amount: float = Field(..., ge=0, description="Amount being invested/used in this action")
    financial_goal: float = Field(..., ge=0, description="Target wealth/financial goal")
    risk_preference: str = Field(
        default="moderate",
        description="One of: conservative, moderate, aggressive",
    )


class RiskSignals(BaseModel):
    """Simulated fraud/risk signals for the action."""

    device_trust: float = Field(..., ge=0, le=1, description="0=untrusted, 1=trusted")
    location_anomaly: bool = Field(False, description="True if location is unusual")
    otp_retry_attempts: int = Field(0, ge=0, le=10, description="Number of OTP retries")
    investment_size_anomaly: bool = Field(
        False,
        description="True if amount is unusually large vs history",
    )
    rapid_action: bool = Field(
        False,
        description="True if action is very fast after login/trigger",
    )


class EvaluateActionRequest(BaseModel):
    """Full request body for POST /evaluate-action."""

    wealth: WealthInputs
    risk_signals: RiskSignals
    # Optional: for gamification context (e.g. current streak from session)
    current_streak_months: Optional[int] = Field(0, ge=0)
    total_xp: Optional[int] = Field(0, ge=0)


# ---------- Response: Wealth ----------


class WealthAnalysis(BaseModel):
    surplus: float = Field(..., description="Income minus expenses/savings delta")
    months_to_goal: float = Field(..., description="Estimated months to reach financial goal")
    confidence_level: float = Field(..., ge=0, le=1, description="Model confidence in projection")
    recommendation_message: str = Field(..., description="Human-readable recommendation")


# ---------- Response: Risk ----------


class RiskSignalBreakdown(BaseModel):
    name: str
    score: float
    weight: float
    explanation: str


class RiskAnalysis(BaseModel):
    total_risk_score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    reasoning: list[str] = Field(..., description="Explainable reasoning lines")
    signal_breakdown: list[RiskSignalBreakdown] = Field(default_factory=list)


# ---------- Response: Gamification ----------


class GamificationResponse(BaseModel):
    savings_streak_months: int = Field(0, description="Current savings streak")
    streak_at_risk: bool = Field(False, description="True if this action may break streak")
    xp_earned: int = Field(0)
    badges: list[str] = Field(default_factory=list)
    habit_suggestion: str = Field("", description="Reinforcement message")


# ---------- Response: Final decision ----------


class FinalDecision(BaseModel):
    outcome: DecisionOutcome = Field(..., description="allow | warn | block")
    message: str = Field(..., description="User-facing explanation")
    cooling_off_hours: Optional[float] = Field(None, description="If warn, suggested delay in hours")


# ---------- Full response (camelCase for API JSON) ----------


class EvaluateActionResponse(BaseModel):
    model_config = {"populate_by_name": True}

    wealth_analysis: WealthAnalysis = Field(..., alias="wealthAnalysis")
    risk_analysis: RiskAnalysis = Field(..., alias="riskAnalysis")
    gamification: GamificationResponse = Field(..., alias="gamification")
    final_decision: FinalDecision = Field(..., alias="finalDecision")


# ---------- Simulation: Investment ----------


class SimulateInvestmentRequest(BaseModel):
    model_config = {"populate_by_name": True}

    sip_amount: float = Field(..., ge=0, alias="sipAmount")
    risk_level: str = Field(..., alias="riskLevel")  # "low" | "moderate" | "high"
    duration_years: float = Field(..., ge=0.1, alias="durationYears")
    current_balance: float = Field(..., ge=0, alias="currentBalance")


class SimulateInvestmentResponse(BaseModel):
    total_invested: float = Field(..., alias="totalInvested")
    projected_value: float = Field(..., alias="projectedValue")
    real_adjusted_value: float = Field(..., alias="realAdjustedValue")
    profit: float = Field(..., alias="profit")
    expected_return_rate: float = Field(..., alias="expectedReturnRate")


# ---------- Simulation: Purchase ----------


class SimulatePurchaseRequest(BaseModel):
    model_config = {"populate_by_name": True}

    purchase_amount: float = Field(..., ge=0, alias="purchaseAmount")
    balance: float = Field(..., ge=0, alias="balance")
    monthly_income: float = Field(..., ge=0, alias="monthlyIncome")
    goal_amount: float = Field(..., ge=0, alias="goalAmount")


class SimulatePurchaseResponse(BaseModel):
    updated_balance: float = Field(..., alias="updatedBalance")
    percentage_of_income: float = Field(..., alias="percentageOfIncome")
    goal_delay_months: float = Field(..., alias="goalDelayMonths")
    financial_impact_score: float = Field(..., alias="financialImpactScore")
    warning_level: str = Field(..., alias="warningLevel")  # "Low" | "Medium" | "High"


# ---------- Simulation: Security ----------


class SimulateSecurityRequest(BaseModel):
    model_config = {"populate_by_name": True}

    device_trusted: bool = Field(..., alias="deviceTrusted")
    two_factor_enabled: bool = Field(..., alias="twoFactorEnabled")
    unusual_alerts: bool = Field(..., alias="unusualAlerts")
    investment_size: float = Field(..., ge=0, alias="investmentSize")
    rapid_actions: bool = Field(..., alias="rapidActions")


class SimulateSecurityResponse(BaseModel):
    risk_score: float = Field(..., alias="riskScore")
    risk_level: str = Field(..., alias="riskLevel")  # "Secure" | "Elevated" | "High Risk"
    recommendation: str = Field(..., alias="recommendation")
