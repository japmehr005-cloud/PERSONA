import './FinancialBreakdown.css'

export default function FinancialBreakdown({ user }) {
  const income = user?.income ?? 0
  const expenses = user?.monthlyExpenses ?? 0
  const savings = Math.max(0, income - expenses)
  const savingsRatePct = income > 0 ? ((savings / income) * 100).toFixed(1) : '0'

  return (
    <div className="financial-breakdown">
      <h2 className="breakdown-title">Monthly financial breakdown</h2>
      <div className="breakdown-cards">
        <div className="breakdown-card">
          <span className="breakdown-label">Monthly income</span>
          <span className="breakdown-value breakdown-income">₹{income.toLocaleString('en-IN')}</span>
        </div>
        <div className="breakdown-card">
          <span className="breakdown-label">Monthly expenses</span>
          <span className="breakdown-value breakdown-expenses">₹{expenses.toLocaleString('en-IN')}</span>
        </div>
        <div className="breakdown-card">
          <span className="breakdown-label">Savings</span>
          <span className="breakdown-value breakdown-savings">₹{savings.toLocaleString('en-IN')}</span>
        </div>
        <div className="breakdown-card">
          <span className="breakdown-label">Savings rate</span>
          <span className="breakdown-value breakdown-rate">{savingsRatePct}%</span>
        </div>
      </div>
    </div>
  )
}
