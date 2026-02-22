import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { getPortfolioSummary, simulateInvestment } from '../api'
import InvestmentList from '../components/InvestmentList'
import './Portfolio.css'

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

export default function Portfolio() {
  const { user, updateUser } = useUser()
  const [portfolio, setPortfolio] = useState(null)
  const [sipAmount, setSipAmount] = useState('')
  const [risk, setRisk] = useState(user?.riskPreference ?? 'Moderate')
  const [durationYears, setDurationYears] = useState('')
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const investments = Array.isArray(user?.investments) ? user.investments : []
  const balance = user?.balance ?? 0
  const sipNum = Number(sipAmount) || 0
  const durationNum = Number(durationYears) || 0
  const canSimulate = sipNum > 0 && durationNum >= 1
  const canConfirm = canSimulate && sipNum <= balance && simResult

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
    const next = [...investments, {
      sipAmount: sipNum,
      riskLevel: risk,
      durationYears: durationNum,
      startDate: new Date().toISOString(),
      projectedValue: Math.round(projectedValue * 100) / 100,
    }]
    updateUser({ balance: newBalance, savings: newSavings, investments: next })
    setSipAmount('')
    setDurationYears('')
    setSimResult(null)
    setShowAdd(false)
  }

  const handleRemove = (index) => {
    const next = investments.filter((_, i) => i !== index)
    updateUser({ investments: next })
  }

  const alloc = portfolio?.allocation ?? {}

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Portfolio</h1>

      <section className="portfolio-summary">
        <div className="portfolio-summary-row">
          <span className="portfolio-summary-label">Portfolio value</span>
          <span className="portfolio-summary-value">₹{(portfolio?.totalPortfolioValue ?? 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="portfolio-summary-row">
          <span className="portfolio-summary-label">Total invested</span>
          <span className="portfolio-summary-value">₹{(portfolio?.totalInvested ?? 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="portfolio-summary-row">
          <span className="portfolio-summary-label">Total returns</span>
          <span className={`portfolio-summary-value ${(portfolio?.totalReturns ?? 0) >= 0 ? 'positive' : 'negative'}`}>
            ₹{(portfolio?.totalReturns ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="portfolio-allocation">
          <span className="portfolio-summary-label">Allocation</span>
          <div className="portfolio-allocation-bars">
            <span>Low {alloc.low ?? 0}%</span>
            <span>Moderate {alloc.moderate ?? 0}%</span>
            <span>High {alloc.high ?? 0}%</span>
          </div>
        </div>
      </section>

      <section className="portfolio-sips">
        <h2 className="portfolio-section-title">Active SIPs</h2>
        <InvestmentList investments={investments} onRemove={handleRemove} />
      </section>

      {!showAdd ? (
        <button type="button" onClick={() => setShowAdd(true)} className="portfolio-add-btn">
          Add investment
        </button>
      ) : (
        <div className="portfolio-add-card">
          <h3 className="portfolio-add-title">Add investment</h3>
          <p className="portfolio-add-balance">Balance: ₹{balance.toLocaleString('en-IN')}</p>
          <div className="portfolio-add-form">
            <label>
              <span>SIP (₹/mo)</span>
              <input type="number" min={0} step={1} value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="Amount" />
            </label>
            <label>
              <span>Risk</span>
              <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                {RISK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>
              <span>Duration (yrs)</span>
              <input type="number" min={1} step={1} value={durationYears} onChange={(e) => setDurationYears(e.target.value)} placeholder="Years" />
            </label>
          </div>
          <button type="button" onClick={handleSimulate} disabled={!canSimulate || simLoading} className="portfolio-simulate-btn">
            {simLoading ? 'Simulating…' : 'Simulate'}
          </button>
          {simError && <p className="portfolio-error">{simError}</p>}
          {simResult && (
            <div className="portfolio-sim-result">
              <p>Projected: ₹{(simResult.projectedValue ?? 0).toLocaleString('en-IN')}</p>
              <button type="button" onClick={handleConfirm} disabled={sipNum > balance} className="portfolio-confirm-btn">
                Confirm & add
              </button>
            </div>
          )}
          <button type="button" onClick={() => { setShowAdd(false); setSimResult(null); setSimError(null); }} className="portfolio-cancel-btn">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
