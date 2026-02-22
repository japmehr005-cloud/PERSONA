import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { simulateInvestment } from '../api'
import Card from '../components/Card'
import './Invest.css'

const RISK_OPTIONS = ['Low', 'Moderate', 'High']
const RISK_TO_API = { Low: 'low', Moderate: 'moderate', High: 'high' }
const ANNUAL_RETURNS = { low: 0.06, moderate: 0.10, high: 0.15 }

function projectedValueForSip(sipAmount, riskLevel, durationYears) {
  const rate = ANNUAL_RETURNS[RISK_TO_API[riskLevel] || 'moderate'] ?? 0.10
  const r = rate / 12
  const n = durationYears * 12
  if (r <= 0) return sipAmount * n
  return sipAmount * ((Math.pow(1 + r, n) - 1) / r)
}

export default function Invest() {
  const { user, updateUser } = useUser()
  const [sipAmount, setSipAmount] = useState(5000)
  const [risk, setRisk] = useState(user?.riskPreference ?? 'Moderate')
  const [durationYears, setDurationYears] = useState(5)
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)

  const balance = user?.balance ?? 0
  const canConfirm = sipAmount > 0 && sipAmount <= balance

  const handleSimulate = async () => {
    setSimLoading(true)
    setSimError(null)
    setSimResult(null)
    try {
      const data = await simulateInvestment({
        sipAmount,
        riskLevel: RISK_TO_API[risk] ?? 'moderate',
        durationYears,
        currentBalance: balance,
      })
      setSimResult(data)
    } catch (e) {
      setSimError(e.message)
    } finally {
      setSimLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    const newBalance = balance - sipAmount
    const newSavings = (user?.savings ?? 0) + sipAmount
    const projectedValue = projectedValueForSip(sipAmount, risk, durationYears)
    const investments = Array.isArray(user?.investments) ? [...user.investments] : []
    investments.push({
      sipAmount,
      riskLevel: risk,
      durationYears,
      startDate: new Date().toISOString(),
      projectedValue: Math.round(projectedValue * 100) / 100,
    })
    updateUser({ balance: newBalance, savings: newSavings, investments })
  }

  return (
    <div className="invest-page">
      <h1 className="page-title">Invest</h1>
      <p className="page-subtitle">Set up or adjust your SIP and see projected growth.</p>

      <div className="invest-context">
        <p className="invest-context-line">Available balance: ₹{balance.toLocaleString('en-IN')}</p>
        {user?.income > 0 && (
          <p className="invest-context-line">Monthly income: ₹{(user.income).toLocaleString('en-IN')}</p>
        )}
      </div>

      <div className="invest-form">
        <label className="form-field">
          <span>SIP amount (₹/month)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={sipAmount}
            onChange={(e) => setSipAmount(Number(e.target.value) || 0)}
          />
        </label>
        <label className="form-field">
          <span>Risk</span>
          <select value={risk} onChange={(e) => setRisk(e.target.value)}>
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Duration (years)</span>
          <input
            type="number"
            min={1}
            max={40}
            step={1}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value) || 1)}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSimulate}
        disabled={simLoading}
        className="invest-simulate-btn"
      >
        {simLoading ? 'Simulating…' : 'Simulate investment'}
      </button>

      {simError && <div className="invest-error">{simError}</div>}

      {simResult && (
        <Card className="invest-results-card">
          <h3 className="card-title">Simulation results</h3>
          <div className="invest-results-grid">
            <div className="invest-result-row">
              <span className="invest-result-label">Total invested</span>
              <span className="invest-result-value">₹{(simResult.totalInvested ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="invest-result-row">
              <span className="invest-result-label">Projected value</span>
              <span className="invest-result-value">₹{(simResult.projectedValue ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="invest-result-row">
              <span className="invest-result-label">Inflation adjusted</span>
              <span className="invest-result-value">₹{(simResult.realAdjustedValue ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="invest-result-row">
              <span className="invest-result-label">Profit</span>
              <span className={`invest-result-value invest-profit ${(simResult.profit ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                ₹{(simResult.profit ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="invest-result-row">
              <span className="invest-result-label">Expected return rate</span>
              <span className="invest-result-value">{((simResult.expectedReturnRate ?? 0) * 100).toFixed(2)}%</span>
            </div>
          </div>
        </Card>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="invest-confirm-btn"
      >
        Confirm investment
      </button>

      <section className="invest-explanation">
        <h2 className="section-title">How it works</h2>
        <p>
          SIP (Systematic Investment Plan) lets you invest a fixed amount every month.
          Higher risk typically aims for higher long-term returns but with more short-term volatility.
          Choose a level you’re comfortable with and stay invested for the long term.
        </p>
      </section>
    </div>
  )
}
