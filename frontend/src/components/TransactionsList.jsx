import './TransactionsList.css'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function TransactionsList({ transactions, limit = 10 }) {
  const list = Array.isArray(transactions) ? transactions : []
  const recent = list.slice(0, limit)

  if (recent.length === 0) {
    return (
      <div className="transactions-list">
        <h2 className="transactions-title">Recent transactions</h2>
        <p className="transactions-empty">No transactions yet.</p>
      </div>
    )
  }

  return (
    <div className="transactions-list">
      <h2 className="transactions-title">Recent transactions</h2>
      <ul className="transactions-ul">
        {recent.map((t, i) => (
          <li key={i} className={`transactions-item transactions-${t.type ?? 'expense'}`}>
            <span className="transactions-type">{t.type === 'income' ? 'Income' : 'Expense'}</span>
            <span className="transactions-amount">
              {t.type === 'income' ? '+' : '−'}₹{(t.amount ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="transactions-date">{formatDate(t.date)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
