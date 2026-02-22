import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { dashboard, loadDashboard, loading, addInvestment, addTransaction } = useAuth()
  const [showAddInvestment, setShowAddInvestment] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [sipAmount, setSipAmount] = useState('')
  const [sipRisk, setSipRisk] = useState('moderate')
  const [sipDuration, setSipDuration] = useState('')
  const [txType, setTxType] = useState('income')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard().catch(() => {})
  }, [loadDashboard])

  const handleAddInvestment = async (e) => {
    e.preventDefault()
    const amount = Number(sipAmount) || 0
    const dur = Number(sipDuration) || 0
    if (amount <= 0 || dur < 0.1) {
      setError('Valid SIP amount and duration required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addInvestment({
        sipAmount: amount,
        riskLevel: sipRisk,
        durationYears: dur,
      })
      setSipAmount('')
      setSipDuration('')
      setShowAddInvestment(false)
    } catch (err) {
      setError(err.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    const amount = Number(txAmount) || 0
    if (amount <= 0) {
      setError('Amount required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addTransaction({ type: txType, amount, category: txCategory || undefined })
      setTxAmount('')
      setTxCategory('')
      setShowAddTransaction(false)
    } catch (err) {
      setError(err.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !dashboard) {
    return <div className="dashboard-page"><p className="dashboard-loading">Loading…</p></div>
  }

  const d = dashboard || {}
  const balance = d.balance ?? 0
  const monthlyIncome = d.monthlyIncome ?? 0
  const monthlyExpenses = d.monthlyExpenses ?? 0
  const savingsRate = d.savingsRate ?? 0
  const totalInvested = d.totalInvested ?? 0
  const portfolioValue = d.portfolioValue ?? 0
  const totalReturns = d.totalReturns ?? 0
  const goalProgress = d.goalProgress ?? 0
  const goalTimelineMonths = d.goalTimelineMonths ?? 0
  const activeInvestments = d.activeInvestments ?? []
  const recentTransactions = d.recentTransactions ?? []
  const streak = d.streak ?? {}

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1 className="dashboard-balance-label">Current balance</h1>
        <p className="dashboard-balance-amount">₹{balance.toLocaleString('en-IN')}</p>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Monthly income</span>
          <span className="dashboard-stat-value">₹{monthlyIncome.toLocaleString('en-IN')}</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Monthly expenses</span>
          <span className="dashboard-stat-value">₹{monthlyExpenses.toLocaleString('en-IN')}</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Savings rate</span>
          <span className="dashboard-stat-value">{savingsRate}%</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Total invested</span>
          <span className="dashboard-stat-value">₹{totalInvested.toLocaleString('en-IN')}</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Portfolio value</span>
          <span className="dashboard-stat-value">₹{portfolioValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Total returns</span>
          <span className={`dashboard-stat-value ${(totalReturns >= 0) ? 'positive' : 'negative'}`}>
            ₹{totalReturns.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Goal progress</span>
          <span className="dashboard-stat-value">{goalProgress}%</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-label">Goal timeline</span>
          <span className="dashboard-stat-value">{goalTimelineMonths} mo</span>
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Active investments</h2>
        {activeInvestments.length === 0 ? (
          <p className="dashboard-empty">No SIPs yet. Add one below.</p>
        ) : (
          <ul className="dashboard-investment-list">
            {activeInvestments.map((inv) => (
              <li key={inv.id} className="dashboard-investment-item">
                <span>₹{inv.sipAmount?.toLocaleString('en-IN')}/mo</span>
                <span>{inv.riskLevel}</span>
                <span>{(inv.expectedAnnualReturn * 100).toFixed(0)}%</span>
                <span>₹{inv.totalInvested?.toLocaleString('en-IN')} invested</span>
                <span>₹{inv.currentValue?.toLocaleString('en-IN')} value</span>
                <span>{inv.remainingMonths} mo left</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Recent transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="dashboard-empty">No transactions yet.</p>
        ) : (
          <ul className="dashboard-tx-list">
            {recentTransactions.slice(0, 10).map((tx) => (
              <li key={tx.id} className="dashboard-tx-item">
                <span className={`dashboard-tx-type ${tx.type}`}>{tx.type}</span>
                <span>₹{tx.amount?.toLocaleString('en-IN')}</span>
                <span>{tx.category || '—'}</span>
                <span>{tx.date ? new Date(tx.date).toLocaleDateString() : '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Quick actions</h2>
        <div className="dashboard-actions">
          <button type="button" className="dashboard-action-btn" onClick={() => { setShowAddInvestment(true); setShowAddTransaction(false); setError(''); }}>
            Add investment
          </button>
          <button type="button" className="dashboard-action-btn" onClick={() => { setShowAddTransaction(true); setShowAddInvestment(false); setTxType('income'); setError(''); }}>
            Add income
          </button>
          <button type="button" className="dashboard-action-btn" onClick={() => { setShowAddTransaction(true); setShowAddInvestment(false); setTxType('expense'); setError(''); }}>
            Add expense
          </button>
          <button type="button" className="dashboard-action-btn" onClick={() => { setShowAddTransaction(true); setShowAddInvestment(false); setTxType('purchase'); setError(''); }}>
            Add purchase
          </button>
          <Link to="/simulation" className="dashboard-action-btn dashboard-action-link">Simulation</Link>
          <Link to="/streaks" className="dashboard-action-btn dashboard-action-link">Streaks</Link>
        </div>
      </section>

      {showAddInvestment && (
        <div className="dashboard-modal">
          <div className="dashboard-modal-inner">
            <h3>Add investment (real)</h3>
            <form onSubmit={handleAddInvestment}>
              <label>
                <span>SIP amount (₹/mo)</span>
                <input type="number" min={0} step={1} value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="0" />
              </label>
              <label>
                <span>Risk</span>
                <select value={sipRisk} onChange={(e) => setSipRisk(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                <span>Duration (years)</span>
                <input type="number" min={0.1} step={1} value={sipDuration} onChange={(e) => setSipDuration(e.target.value)} placeholder="0" />
              </label>
              {error && <p className="dashboard-form-error">{error}</p>}
              <div className="dashboard-modal-btns">
                <button type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
                <button type="button" onClick={() => { setShowAddInvestment(false); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTransaction && (
        <div className="dashboard-modal">
          <div className="dashboard-modal-inner">
            <h3>Add {txType}</h3>
            <form onSubmit={handleAddTransaction}>
              <label>
                <span>Amount (₹)</span>
                <input type="number" min={0} step={1} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0" />
              </label>
              <label>
                <span>Category (optional)</span>
                <input type="text" value={txCategory} onChange={(e) => setTxCategory(e.target.value)} placeholder="e.g. Salary" />
              </label>
              {error && <p className="dashboard-form-error">{error}</p>}
              <div className="dashboard-modal-btns">
                <button type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
                <button type="button" onClick={() => { setShowAddTransaction(false); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {streak && (streak.monthsActive > 0 || streak.points > 0 || (streak.badgeNames && streak.badgeNames.length > 0)) && (
        <section className="dashboard-streak-summary">
          <span>Streak: {streak.monthsActive ?? 0} mo</span>
          <span>Points: {streak.points ?? 0}</span>
          {streak.badgeNames?.length > 0 && <span>Badges: {streak.badgeNames.join(', ')}</span>}
        </section>
      )}
    </div>
  )
}
