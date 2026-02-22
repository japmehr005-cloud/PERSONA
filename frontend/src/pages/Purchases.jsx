import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { simulatePurchase } from '../api'
import Card from '../components/Card'
import './Purchases.css'

const CATEGORIES = [
  'Food & dining',
  'Shopping',
  'Entertainment',
  'Travel',
  'Bills & utilities',
  'Health',
  'Subscriptions',
  'Other',
]

export default function Purchases() {
  const { user, updateUser } = useUser()
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)

  const balance = user?.balance ?? 0
  const income = user?.income ?? 0
  const goalAmount = user?.goalAmount ?? 0
  const canConfirm = amount > 0 && amount <= balance

  const handleSimulate = async () => {
    if (amount <= 0) return
    setSimLoading(true)
    setSimError(null)
    setSimResult(null)
    try {
      const data = await simulatePurchase({
        purchaseAmount: amount,
        balance,
        monthlyIncome: income || 1,
        goalAmount: goalAmount || 1,
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
    const newBalance = balance - amount
    const newSavings = Math.max(0, (user?.savings ?? 0) - amount)
    const transactions = Array.isArray(user?.transactions) ? [...user.transactions] : []
    transactions.unshift({ type: 'purchase', amount, category, date: new Date().toISOString() })
    updateUser({ balance: newBalance, savings: newSavings, transactions })
    setAmount(0)
    setSimResult(null)
  }

  const warningClass = simResult?.warningLevel === 'Low' ? 'low' : simResult?.warningLevel === 'Medium' ? 'medium' : 'high'

  return (
    <div className="purchases-page">
      <h1 className="page-title">Purchases</h1>
      <p className="page-subtitle">Log a purchase and see its impact on your plan.</p>

      <div className="purchases-form">
        <label className="form-field">
          <span>Amount (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={amount || ''}
            onChange={(e) => {
              const v = Number(e.target.value) || 0
              setAmount(v)
              setSimResult(null)
            }}
            placeholder="0"
          />
        </label>
        <label className="form-field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handleSimulate}
        disabled={simLoading || amount <= 0}
        className="purchases-simulate-btn"
      >
        {simLoading ? 'Simulating…' : 'Simulate purchase'}
      </button>

      {simError && <div className="purchases-error">{simError}</div>}

      {simResult && (
        <Card className="purchases-result-card">
          <h3 className="card-title">Simulation results</h3>
          <div className="purchases-result-grid">
            <div className="purchases-result-row">
              <span className="purchases-result-label">% of income</span>
              <span className="purchases-result-value">{simResult.percentageOfIncome?.toFixed(1) ?? 0}%</span>
            </div>
            <div className="purchases-result-row">
              <span className="purchases-result-label">Goal delay</span>
              <span className="purchases-result-value">{simResult.goalDelayMonths?.toFixed(1) ?? 0} months</span>
            </div>
            <div className="purchases-result-row">
              <span className="purchases-result-label">Impact score</span>
              <span className="purchases-result-value">{simResult.financialImpactScore ?? 0}/100</span>
            </div>
            <div className="purchases-result-row">
              <span className="purchases-result-label">Warning level</span>
              <span className={`purchases-result-value purchases-warning purchases-warning-${warningClass}`}>
                {simResult.warningLevel ?? '—'}
              </span>
            </div>
          </div>
          <p className="purchases-updated-balance">Balance after purchase: ₹{(simResult.updatedBalance ?? 0).toLocaleString('en-IN')}</p>
        </Card>
      )}

      <p className="purchases-balance">Current balance: ₹{balance.toLocaleString('en-IN')}</p>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="purchases-confirm-btn"
      >
        Confirm purchase
      </button>
    </div>
  )
}
