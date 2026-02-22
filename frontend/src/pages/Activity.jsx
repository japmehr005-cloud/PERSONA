import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import './Activity.css'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function Activity() {
  const { user, updateUser } = useUser()
  const [addType, setAddType] = useState(null)
  const [addAmount, setAddAmount] = useState('')

  const transactions = Array.isArray(user?.transactions) ? user.transactions : []
  const incomeEntries = transactions.filter((t) => t.type === 'income')
  const expenseEntries = transactions.filter((t) => t.type === 'expense')
  const purchaseEntries = transactions.filter((t) => t.type === 'purchase')

  const handleAddSubmit = (e) => {
    e.preventDefault()
    const amount = Number(addAmount) || 0
    if (amount <= 0) return
    const balance = user?.balance ?? 0
    const next = [...transactions, { type: addType, amount, date: new Date().toISOString() }]
    const newBalance = addType === 'income' ? balance + amount : balance - amount
    updateUser({ balance: newBalance, transactions: next })
    setAddType(null)
    setAddAmount('')
  }

  const renderEntries = (list, label) => {
    if (list.length === 0) return <p className="activity-empty">{label}: none</p>
    return (
      <ul className="activity-ul">
        {list.map((t, i) => (
          <li key={i} className={`activity-item activity-${t.type}`}>
            <span className="activity-type">{t.type === 'income' ? 'Income' : t.type === 'purchase' ? 'Purchase' : 'Expense'}</span>
            <span className="activity-amount">
              {t.type === 'income' ? '+' : '−'}₹{(t.amount ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="activity-date">{formatDate(t.date)}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="activity-page">
      <h1 className="page-title">Activity</h1>

      <section className="activity-add">
        <button type="button" onClick={() => setAddType('income')} className="activity-add-btn income">
          + Add income
        </button>
        <button type="button" onClick={() => setAddType('expense')} className="activity-add-btn expense">
          + Add expense
        </button>
        <Link to="/purchases" className="activity-add-btn purchase">Log purchase</Link>
      </section>

      {addType && (
        <form onSubmit={handleAddSubmit} className="activity-add-form">
          <h3 className="activity-add-title">{addType === 'income' ? 'Add income' : 'Add expense'}</h3>
          <label>
            <span>Amount (₹)</span>
            <input type="number" min={1} step={1} value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" />
          </label>
          <div className="activity-add-actions">
            <button type="submit" className="activity-submit-btn">Add</button>
            <button type="button" onClick={() => { setAddType(null); setAddAmount(''); }} className="activity-cancel-btn">Cancel</button>
          </div>
        </form>
      )}

      <section className="activity-section">
        <h2 className="activity-section-title">Income</h2>
        {renderEntries(incomeEntries, 'Income')}
      </section>
      <section className="activity-section">
        <h2 className="activity-section-title">Expenses</h2>
        {renderEntries(expenseEntries, 'Expenses')}
      </section>
      <section className="activity-section">
        <h2 className="activity-section-title">Purchases</h2>
        {renderEntries(purchaseEntries, 'Purchases')}
      </section>
    </div>
  )
}
