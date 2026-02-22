import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Setup.css'

const RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
]

export default function Setup() {
  const navigate = useNavigate()
  const { setup } = useAuth()
  const [startingBalance, setStartingBalance] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [monthlyFixedExpenses, setMonthlyFixedExpenses] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [financialGoal, setFinancialGoal] = useState('')
  const [riskPreference, setRiskPreference] = useState('moderate')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await setup({
        startingBalance: Number(startingBalance) || 0,
        monthlyIncome: Number(monthlyIncome) || 0,
        monthlyFixedExpenses: Number(monthlyFixedExpenses) || 0,
        savingsTarget: Number(savingsTarget) || 0,
        financialGoal: Number(financialGoal) || 0,
        riskPreference,
      })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h1 className="setup-title">Set up your profile</h1>
        <p className="setup-desc">Backend will initialize your balance and goals.</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <label className="setup-field">
            <span>Starting balance (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="setup-field">
            <span>Monthly income (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="setup-field">
            <span>Monthly fixed expenses (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={monthlyFixedExpenses}
              onChange={(e) => setMonthlyFixedExpenses(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="setup-field">
            <span>Savings target (₹/month)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="setup-field">
            <span>Financial goal amount (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="setup-field">
            <span>Risk preference</span>
            <select value={riskPreference} onChange={(e) => setRiskPreference(e.target.value)}>
              {RISK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          {error && <p className="setup-error">{error}</p>}
          <button type="submit" className="setup-btn" disabled={loading}>
            {loading ? 'Saving…' : 'Save & go to dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
