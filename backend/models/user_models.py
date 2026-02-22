"""
Persona – User and financial models.
Backend single source of truth. All fields snake_case internally, camelCase for API.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Nested models ----------


class Investment(BaseModel):
    id: str = Field(default_factory=new_id)
    sip_amount: float = Field(..., ge=0, alias="sipAmount")
    risk_level: str = Field(..., alias="riskLevel")  # low | moderate | high
    expected_annual_return: float = Field(..., ge=0, le=1, alias="expectedAnnualReturn")
    duration_years: float = Field(..., ge=0.1, alias="durationYears")
    start_date: str = Field(..., alias="startDate")  # ISO date
    projected_value: float = Field(0, ge=0, alias="projectedValue")
    total_invested: float = Field(0, ge=0, alias="totalInvested")
    current_value: float = Field(0, ge=0, alias="currentValue")

    model_config = {"populate_by_name": True}


class Transaction(BaseModel):
    id: str = Field(default_factory=new_id)
    type: str = Field(...)  # income | expense | investment | purchase
    amount: float = Field(..., ge=0)
    category: Optional[str] = None
    date: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {"populate_by_name": True}


class StreakData(BaseModel):
    months_active: int = Field(0, ge=0, alias="monthsActive")
    last_investment_date: Optional[str] = Field(None, alias="lastInvestmentDate")  # YYYY-MM
    points: int = Field(0, ge=0)
    badges: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


# ---------- User (full state) ----------


class User(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str = ""
    password_hash: str = ""  # mock: store plain for simplicity, or hash
    monthly_income: float = Field(0, ge=0, alias="monthlyIncome")
    monthly_fixed_expenses: float = Field(0, ge=0, alias="monthlyFixedExpenses")
    savings_target: float = Field(0, ge=0, alias="savingsTarget")
    financial_goal: float = Field(0, ge=0, alias="financialGoal")
    risk_preference: str = Field("moderate", alias="riskPreference")  # low | moderate | high
    balance: float = Field(0, ge=0)
    investments: list[Investment] = Field(default_factory=list)
    transactions: list[Transaction] = Field(default_factory=list)
    streak: StreakData = Field(default_factory=StreakData)
    setup_done: bool = Field(False, alias="setupDone")

    model_config = {"populate_by_name": True}

    def to_api(self) -> dict:
        """Serialize for API (camelCase)."""
        return self.model_dump(by_alias=True, mode="json")


# ---------- Request/Response DTOs ----------


class LoginRequest(BaseModel):
    name: str
    password: str = ""


class SetupRequest(BaseModel):
    model_config = {"populate_by_name": True}
    starting_balance: float = Field(..., ge=0, alias="startingBalance")
    monthly_income: float = Field(..., ge=0, alias="monthlyIncome")
    monthly_fixed_expenses: float = Field(..., ge=0, alias="monthlyFixedExpenses")
    savings_target: float = Field(..., ge=0, alias="savingsTarget")
    financial_goal: float = Field(..., ge=0, alias="financialGoal")
    risk_preference: str = Field("moderate", alias="riskPreference")


class AddInvestmentRequest(BaseModel):
    model_config = {"populate_by_name": True}
    sip_amount: float = Field(..., ge=0, alias="sipAmount")
    risk_level: str = Field(..., alias="riskLevel")
    duration_years: float = Field(..., ge=0.1, alias="durationYears")


class AddTransactionRequest(BaseModel):
    type: str  # income | expense | purchase
    amount: float = Field(..., ge=0)
    category: Optional[str] = None


class SimulateSipRequest(BaseModel):
    model_config = {"populate_by_name": True}
    sip_amount: float = Field(..., ge=0, alias="sipAmount")
    risk_level: str = Field(..., alias="riskLevel")
    duration_years: float = Field(..., ge=0.1, alias="durationYears")


class SimulatePurchaseRequest(BaseModel):
    model_config = {"populate_by_name": True}
    amount: float = Field(..., ge=0)


class ApplySimulationRequest(BaseModel):
    """Apply last simulation to real data."""
    type: str  # "sip" | "purchase"
    # For sip: use same params as simulation
    sip_amount: Optional[float] = Field(None, alias="sipAmount")
    risk_level: Optional[str] = Field(None, alias="riskLevel")
    duration_years: Optional[float] = Field(None, alias="durationYears")
    # For purchase
    amount: Optional[float] = None
    category: Optional[str] = None

    model_config = {"populate_by_name": True}
