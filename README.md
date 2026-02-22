# SecureWealth Twin – Gen Z Edition

A **digital wealth intelligence** prototype for a public sector bank: wealth simulation, behavioral finance reinforcement, fraud-aware protection scoring, and gamified financial habit tracking.

## Features

- **Wealth Intelligence Engine** – Surplus, months to goal, confidence, recommendations
- **Fraud & Protection Engine** – Weighted risk signals (device, location, OTP, amount, timing), explainable reasoning, Allow / Warn / Block
- **Behavioral Reinforcement** – Savings streak, XP, badges, habit suggestions
- **Dashboard** – Overview cards, risk gauge, decision badge, streak tracker, action panel, insight panel with risk heat

## Tech Stack

- **Frontend:** React (Vite), modern fintech-style UI, responsive
- **Backend:** Python, FastAPI, modular services

## Run locally

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

The frontend proxies `/api` to the backend (see `vite.config.js`), so API calls go to `http://localhost:5173/api/*` and are forwarded to port 8000.

### 3. Quick test

1. Open [http://localhost:5173](http://localhost:5173).
2. Adjust wealth inputs and risk signals in the **Action simulation** panel.
3. Click **Evaluate action**.
4. Check the dashboard (cards, risk score, decision badge, streak) and the **Insights** panel (reasoning, badges, decision message).

## API example

**POST /evaluate-action**

Request body (JSON):

```json
{
  "wealth": {
    "monthly_income": 75000,
    "monthly_savings": 15000,
    "investment_amount": 5000,
    "financial_goal": 500000,
    "risk_preference": "moderate"
  },
  "risk_signals": {
    "device_trust": 0.9,
    "location_anomaly": false,
    "otp_retry_attempts": 0,
    "investment_size_anomaly": false,
    "rapid_action": false
  },
  "current_streak_months": 0,
  "total_xp": 0
}
```

Response (camelCase):

```json
{
  "wealthAnalysis": {
    "surplus": 55000,
    "months_to_goal": 28.5,
    "confidence_level": 0.85,
    "recommendation_message": "..."
  },
  "riskAnalysis": {
    "total_risk_score": 2.5,
    "risk_level": "low",
    "reasoning": ["..."],
    "signal_breakdown": []
  },
  "gamification": {
    "savings_streak_months": 1,
    "streak_at_risk": false,
    "xp_earned": 25,
    "badges": ["First Step (1 mo)"],
    "habit_suggestion": "..."
  },
  "finalDecision": {
    "outcome": "allow",
    "message": "Risk is low. You may proceed with this action.",
    "cooling_off_hours": null
  }
}
```

## Project structure

```
Persona/
├── backend/
│   ├── main.py              # FastAPI app, POST /evaluate-action, CORS
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   └── services/
│       ├── wealth_service.py
│       ├── risk_service.py
│       └── gamification_service.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # proxy /api -> :8000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js            # evaluateAction(), health()
│       ├── index.css
│       └── components/
│           ├── Dashboard.jsx / .css
│           ├── ActionPanel.jsx / .css
│           └── InsightPanel.jsx / .css
└── README.md
```

## Design notes

- **Wealth:** Surplus = income − savings − investment amount. Months to goal use compound growth by risk preference (conservative/moderate/aggressive). Confidence reflects savings rate and goal realism.
- **Risk:** Five signals with fixed weights; total 0–100. Low &lt; 25 → Allow; Medium &lt; 60 → Warn + cooling-off; High → Block. Reasoning is generated from the signal breakdown.
- **Gamification:** Streak increases when surplus and savings rate are healthy; XP and badges from milestones. “Streak at risk” when the current action would break the streak.

## License

MIT (or as required for the hackathon).
