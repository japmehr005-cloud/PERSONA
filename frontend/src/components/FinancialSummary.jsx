import './FinancialSummary.css'

const BADGES = [
  { months: 1, name: 'First Step' },
  { months: 3, name: 'Consistent Saver' },
  { months: 5, name: 'Five-Month Streak' },
  { months: 6, name: 'Half-Year Hero' },
  { months: 12, name: 'Year-Long Champion' },
]

export default function FinancialSummary({ user }) {
  const income = user?.income ?? 0
  const recurringExpenses = Array.isArray(user?.recurringExpenses) ? user.recurringExpenses : []
  const totalExpenses = recurringExpenses.length
    ? recurringExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    : (user?.monthlyExpenses ?? 0)
  const savings = Math.max(0, income - totalExpenses)
  const savingsRatePct = income > 0 ? ((savings / income) * 100).toFixed(1) : '0'
  const streakMonths = user?.streak ?? 0
  const earnedBadges = BADGES.filter((b) => streakMonths >= b.months)
  const investments = Array.isArray(user?.investments) ? user.investments : []
  const totalSip = investments.reduce((s, inv) => s + (inv.sipAmount ?? 0), 0)
  const totalProjected = investments.reduce((s, inv) => s + (inv.projectedValue ?? 0), 0)
  const healthScore =
    user?.healthScore != null
      ? user.healthScore
      : income > 0
        ? Math.min(100, Math.round(Number(savingsRatePct) * 1.2 + 20))
        : null

  return (
    <div className="financial-summary">
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Current balance</span>
          <span className="summary-value summary-balance">₹{(user?.balance ?? 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Monthly income</span>
          <span className="summary-value">₹{income.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total monthly expenses</span>
          <span className="summary-value">₹{totalExpenses.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Savings rate</span>
          <span className="summary-value">{savingsRatePct}%</span>
        </div>
        {healthScore != null && (
          <div className="summary-item">
            <span className="summary-label">Financial health score</span>
            <span className="summary-value summary-health">{healthScore}/100</span>
          </div>
        )}
        <div className="summary-item">
          <span className="summary-label">Current streak</span>
          <span className="summary-value summary-streak">{streakMonths} months</span>
        </div>
      </div>

      <div className="summary-badges">
        <span className="summary-label">Earned badges</span>
        <div className="summary-badges-list">
          {earnedBadges.length > 0 ? (
            earnedBadges.map((b) => (
              <span key={b.months} className="summary-badge">{b.name}</span>
            ))
          ) : (
            <span className="summary-badges-none">None yet</span>
          )}
        </div>
      </div>

      <div className="summary-sip">
        <span className="summary-label">Total SIP investments</span>
        <span className="summary-value">₹{totalSip.toLocaleString('en-IN')}/mo · Projected ₹{totalProjected.toLocaleString('en-IN')} ({investments.length} active)</span>
      </div>
    </div>
  )
}
