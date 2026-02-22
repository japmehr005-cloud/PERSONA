import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { simulateInvestment, getPortfolioSummary } from '../api'
import InvestmentList from '../components/InvestmentList'
import Card from '../components/Card'
import './Investments.css'

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

export default function Investments() {
  const { user, updateUser } = useUser()
  const [sipAmount, setSipAmount] = useState('')
  const [risk, setRisk] = useState(user?.riskPreference ?? 'Moderate')
  const [durationYears, setDurationYears] = useState('')
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)

  const investments = Array.isArray(user?.investments) ? user.investments : []
  const balance = user?.balance ?? 0
  const sipNum = Number(sipAmount) || 0
  const durationNum = Number(durationYears) || 0
  const canSimulate = sipNum > 0 && durationNum >= 1
  const canConfirm = canSimulate && sipNum <= balance && simResult

  const [portfolio, setPortfolio] = useState(null)
  useEffect(() => {
    let cancelled = false
    getPortfolioSummary(investments)
      .then((data) => { if (!cancelled) setPortfolio(data) })
      .catch(() => { if (!cancelled) setPortfolio(null) })
    return () => { cancelled = true }
  }, [investments.length, JSON.stringify(investments)])

  const handleSimulate = async () => {
    if (!canSimulate) return
    setSimLoading(true)
    setSimError(null)
    setSimResult(null)
    try {
      const data = await simulateInvestment({
        sipAmount: sipNum,
        riskLevel: RISK_TO_API[risk] ?? 'moderate',
        durationYears: durationNum,
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
    const newBalance = balance - sipNum
    const newSavings = (user?.savings ?? 0) + sipNum
    const projectedValue = simResult?.projectedValue ?? projectedValueForSip(sipNum, risk, durationNum)
    const investments = Array.isArray(user?.investments) ? [...user.investments] : []
    investments.push({
      sipAmount: sipNum,
      riskLevel: risk,
      durationYears: durationNum,
      startDate: new Date().toISOString(),
      projectedValue: Math.round(projectedValue * 100) / 100,
    })
    updateUser({ balance: newBalance, savings: newSavings, investments })
    setSipAmount('')
    setDurationYears('')
    setSimResult(null)
  }

  const handleRemove = (index) => {
    const investments = Array.isArray(user?.investments) ? user.investments : []
    const next = investments.filter((_, i) => i !== index)
    updateUser({ investments: next })
  }

  return (
    <div className="investments-page">
      <h1 className="page-title">Investments</h1>
      <p className="page-subtitle">Real holdings. Adding or removing here updates your balance.</p>

      <section className="investments-summary">
        <div className="investments-summary-row">
          <span className="investments-summary-label">Total invested</span>
          <span className="investments-summary-value">₹{(portfolio?.totalInvested ?? 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="investments-summary-row">
          <span className="investments-summary-label">Total returns</span>
          <span className={`investments-summary-value ${(portfolio?.totalReturns ?? 0) >= 0 ? 'positive' : 'negative'}`}>
            ₹{(portfolio?.totalReturns ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </section>

      <InvestmentList investments={investments} onRemove={handleRemove} />

      <Card className="investments-add-card">
        <h3 className="card-title">Add new SIP</h3>
        <p className="investments-add-context">Balance: ₹{balance.toLocaleString('en-IN')}</p>
        <div className="investments-add-form">
          <label className="investments-field">
            <span>SIP amount (₹/month)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={sipAmount}
              onChange={(e) => setSipAmount(e.target.value)}
              placeholder="Amount"
            />
          </label>
          <label className="investments-field">
            <span>Risk</span>
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              {RISK_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="investments-field">
            <span>Duration (years)</span>
            <input
              type="number"
              min={1}
              step={1}
              value={durationYears}
              onChange={(e) => setDurationYears(e.target.value)}
              placeholder="Years"
            />
          </label>
        </div>
        <button type="button" onClick={handleSimulate} disabled={!canSimulate || simLoading} className="investments-simulate-btn">
          {simLoading ? 'Simulating…' : 'Simulate'}
        </button>
        {simError && <p className="investments-error">{simError}</p>}
        {simResult && (
          <div className="investments-sim-result">
            <p>Projected value: ₹{(simResult.projectedValue ?? 0).toLocaleString('en-IN')}</p>
            <button type="button" onClick={handleConfirm} disabled={sipNum > balance} className="investments-confirm-btn">
              Confirm & add SIP
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
