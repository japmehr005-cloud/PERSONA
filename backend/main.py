"""
Persona – Financial Digital Twin API.
Backend is the single source of truth. All state and calculations live here.

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from models.user_models import (
    User,
    Investment,
    Transaction,
    StreakData,
    LoginRequest,
    SetupRequest,
    AddInvestmentRequest,
    AddTransactionRequest,
    SimulateSipRequest,
    SimulatePurchaseRequest,
    ApplySimulationRequest,
)
from store import (
    get_user_by_name,
    get_user_by_session,
    create_user,
    create_session,
    save_user,
)
from services.finance import (
    get_expected_return,
    sip_future_value,
    sip_total_invested,
    savings_rate,
    goal_progress,
    months_to_goal,
    portfolio_totals,
    refresh_investment_values,
    investment_current_value,
)
from services.streak_service import recompute_streak, add_points_for_investment, BADGES

app = FastAPI(
    title="Persona API",
    description="Financial Digital Twin – real state, simulation, streaks",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_session_id(authorization: str | None = Header(None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:].strip() or None


def require_user(authorization: str | None = Header(None)) -> User:
    session_id = get_session_id(authorization)
    user = get_user_by_session(session_id) if session_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def refresh_user(user: User) -> User:
    """Refresh investment current values and streak, then return user."""
    refresh_investment_values(user.investments)
    user.streak = recompute_streak(user)
    return user


# ---------- Auth ----------


@app.post("/login")
def login(req: LoginRequest):
    """
    Mock auth: name + password. Creates user if new.
    Returns sessionId, user (minimal), needsSetup.
    """
    name = (req.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    user = get_user_by_name(name)
    if not user:
        user = create_user(name, req.password or "")
    session_id = create_session(user.id)
    refresh_user(user)
    save_user(user)
    return {
        "sessionId": session_id,
        "user": {
            "id": user.id,
            "name": user.name,
            "setupDone": user.setup_done,
        },
        "needsSetup": not user.setup_done,
    }


# ---------- Me & Setup ----------


@app.get("/me")
def get_me(user: User = Depends(require_user)):
    """Full user state (backend source of truth)."""
    user = refresh_user(user)
    save_user(user)
    return user.to_api()


@app.post("/setup")
def setup(req: SetupRequest, user: User = Depends(require_user)):
    """
    Initialize profile: balance, income, expenses, goal, risk.
    Backend sets empty investments, transactions, streak=0.
    """
    user.monthly_income = req.monthly_income
    user.monthly_fixed_expenses = req.monthly_fixed_expenses
    user.savings_target = req.savings_target
    user.financial_goal = req.financial_goal
    user.risk_preference = (req.risk_preference or "moderate").lower()
    user.balance = req.starting_balance
    user.investments = []
    user.transactions = []
    user.streak = StreakData(months_active=0, last_investment_date=None, points=0, badges=[])
    user.setup_done = True
    save_user(user)
    return user.to_api()


# ---------- Dashboard (all derived from backend) ----------


@app.get("/dashboard")
def get_dashboard(user: User = Depends(require_user)):
    """
    All numbers derived from backend. No frontend math.
    """
    user = refresh_user(user)
    save_user(user)

    monthly_income = user.monthly_income or 0
    monthly_expenses = user.monthly_fixed_expenses or 0
    savings_target = user.savings_target or 0
    goal = user.financial_goal or 0
    balance = user.balance or 0

    total_invested, portfolio_value, total_returns = portfolio_totals(user.investments)
    savings_rate_pct = savings_rate(monthly_income, monthly_expenses)
    current_savings = balance + portfolio_value  # simplified: treat portfolio as savings toward goal
    goal_progress_pct = goal_progress(current_savings, goal)
    monthly_savings = max(0, monthly_income - monthly_expenses)
    goal_timeline_months = months_to_goal(current_savings, goal, monthly_savings) if goal > current_savings else 0

    # Active investments for list (with duration remaining)
    from datetime import datetime
    now = datetime.utcnow()
    active = []
    for inv in user.investments:
        start = getattr(inv, "start_date", None) or ""
        dur_y = getattr(inv, "duration_years", 0) or 0
        try:
            start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
            elapsed_months = (now.year - start_dt.year) * 12 + (now.month - start_dt.month)
            remaining_months = max(0, dur_y * 12 - elapsed_months)
        except (ValueError, TypeError):
            remaining_months = dur_y * 12
        active.append({
            "id": inv.id,
            "sipAmount": inv.sip_amount,
            "riskLevel": inv.risk_level,
            "expectedAnnualReturn": inv.expected_annual_return,
            "totalInvested": inv.total_invested,
            "currentValue": inv.current_value,
            "projectedValue": inv.projected_value,
            "durationYears": inv.duration_years,
            "remainingMonths": round(remaining_months, 0),
        })

    # Recent transactions (last 20)
    recent = [
        {
            "id": t.id,
            "type": t.type,
            "amount": t.amount,
            "category": t.category,
            "date": t.date,
        }
        for t in (user.transactions or [])[:20]
    ]

    return {
        "balance": balance,
        "monthlyIncome": monthly_income,
        "monthlyExpenses": monthly_expenses,
        "savingsRate": savings_rate_pct,
        "totalInvested": total_invested,
        "portfolioValue": portfolio_value,
        "totalReturns": total_returns,
        "goalProgress": goal_progress_pct,
        "goalTimelineMonths": goal_timeline_months,
        "activeInvestments": active,
        "recentTransactions": recent,
        "streak": {
            "monthsActive": user.streak.months_active,
            "lastInvestmentDate": user.streak.last_investment_date,
            "points": user.streak.points,
            "badges": user.streak.badges,
            "badgeNames": [name for _id, name, _ in BADGES if _id in user.streak.badges],
        },
    }


# ---------- Real actions ----------


@app.post("/investments")
def add_investment(req: AddInvestmentRequest, user: User = Depends(require_user)):
    """
    Add real SIP. Deduct from balance, append investment, update streak.
    """
    user = refresh_user(user)
    sip_amount = req.sip_amount
    if user.balance < sip_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    risk = (req.risk_level or "moderate").lower()
    ann = get_expected_return(risk)
    dur = req.duration_years
    start_date = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    ti, cv, pv = investment_current_value(sip_amount, ann, start_date, dur)

    inv = Investment(
        sip_amount=sip_amount,
        risk_level=risk,
        expected_annual_return=ann,
        duration_years=dur,
        start_date=start_date,
        projected_value=pv,
        total_invested=ti,
        current_value=cv,
    )
    user.investments.append(inv)
    user.balance -= sip_amount
    user.transactions.append(Transaction(type="investment", amount=sip_amount, category="SIP"))

    # Streak and points
    user.streak = recompute_streak(user)
    monthly_savings = max(0, user.monthly_income - user.monthly_fixed_expenses)
    hit_target = monthly_savings >= user.savings_target if user.savings_target else False
    user.streak.points += add_points_for_investment(user, hit_target)

    save_user(user)
    return user.to_api()


@app.post("/transactions")
def add_transaction(req: AddTransactionRequest, user: User = Depends(require_user)):
    """Add income, expense, or purchase. Updates balance."""
    user = refresh_user(user)
    t = Transaction(type=req.type, amount=req.amount, category=req.category or "")
    user.transactions.insert(0, t)
    if req.type == "income":
        user.balance += req.amount
    elif req.type in ("expense", "purchase"):
        if user.balance < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        user.balance -= req.amount
    else:
        raise HTTPException(status_code=400, detail="Invalid type")
    save_user(user)
    return user.to_api()


# ---------- Simulation (what-if only) ----------


@app.post("/simulation/sip")
def simulate_sip(req: SimulateSipRequest, user: User = Depends(require_user)):
    """
    What-if SIP. Returns projected value, impact on goal, liquidity. Does not change real data.
    """
    risk = (req.risk_level or "moderate").lower()
    ann = get_expected_return(risk)
    n_months = req.duration_years * 12
    total_invested = sip_total_invested(req.sip_amount, n_months)
    projected_value = sip_future_value(req.sip_amount, ann, n_months)
    returns = projected_value - total_invested

    # Impact on goal timeline (if they applied this SIP)
    current_savings = user.balance + sum(getattr(i, "current_value", 0) for i in user.investments)
    monthly_savings = max(0, user.monthly_income - user.monthly_fixed_expenses)
    goal = user.financial_goal or 0
    new_liquidity = monthly_savings - req.sip_amount if monthly_savings >= req.sip_amount else 0
    # Simplified: extra savings from this SIP at end of duration
    months_to_goal_before = months_to_goal(current_savings, goal, monthly_savings) if goal > current_savings else 0
    future_savings = current_savings + projected_value
    months_to_goal_after = months_to_goal(future_savings, goal, monthly_savings) if goal > future_savings else 0
    goal_timeline_impact = months_to_goal_before - months_to_goal_after  # positive = faster goal

    return {
        "projectedValue": round(projected_value, 2),
        "totalInvested": total_invested,
        "returns": round(returns, 2),
        "expectedAnnualReturn": ann,
        "goalTimelineImpactMonths": round(goal_timeline_impact, 1),
        "newMonthlyLiquidity": round(new_liquidity, 2),
        "riskLevel": risk,
    }


@app.post("/simulation/purchase")
def simulate_purchase(req: SimulatePurchaseRequest, user: User = Depends(require_user)):
    """What-if purchase. Balance after, goal delay, streak warning. Does not change real data."""
    balance_after = user.balance - req.amount
    monthly_savings = max(0, user.monthly_income - user.monthly_fixed_expenses)
    goal = user.financial_goal or 0
    current_savings = user.balance + sum(getattr(i, "current_value", 0) for i in user.investments)
    goal_delay = (req.amount / monthly_savings) if monthly_savings > 0 else 0
    savings_rate_before = savings_rate(user.monthly_income, user.monthly_fixed_expenses)
    # After purchase we don't change fixed expenses; so savings rate unchanged except psychologically
    streak_warning = balance_after < 0 or (user.streak.months_active > 0 and req.amount > monthly_savings * 0.5)
    return {
        "balanceAfter": round(balance_after, 2),
        "goalDelayMonths": round(goal_delay, 1),
        "streakBreakWarning": streak_warning,
        "savingsRateChange": 0,
    }


@app.post("/simulation/apply")
def apply_simulation(req: ApplySimulationRequest, user: User = Depends(require_user)):
    """
    Apply simulation to real data. type = sip | purchase.
    For sip: sipAmount, riskLevel, durationYears required.
    For purchase: amount, optional category.
    """
    if req.type == "sip":
        if req.sip_amount is None or req.sip_amount <= 0 or not req.risk_level or req.duration_years is None:
            raise HTTPException(status_code=400, detail="sipAmount, riskLevel, durationYears required")
        # Reuse add_investment logic
        add_req = AddInvestmentRequest(
            sip_amount=req.sip_amount,
            risk_level=req.risk_level,
            duration_years=req.duration_years,
        )
        return add_investment(add_req, user)
    if req.type == "purchase":
        if req.amount is None or req.amount <= 0:
            raise HTTPException(status_code=400, detail="amount required")
        add_req = AddTransactionRequest(type="purchase", amount=req.amount, category=req.category or "Purchase")
        return add_transaction(add_req, user)
    raise HTTPException(status_code=400, detail="Invalid type")


# ---------- Streaks (read from user) ----------


@app.get("/streaks")
def get_streaks(user: User = Depends(require_user)):
    """Streak and badges (from backend)."""
    user = refresh_user(user)
    save_user(user)
    badge_names = [name for _id, name, _ in BADGES if _id in user.streak.badges]
    return {
        "monthsActive": user.streak.months_active,
        "lastInvestmentDate": user.streak.last_investment_date,
        "points": user.streak.points,
        "badges": user.streak.badges,
        "badgeNames": badge_names,
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "Persona API"}

