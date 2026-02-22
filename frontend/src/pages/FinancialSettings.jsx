import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import './FinancialSettings.css'

export default function FinancialSettings() {
  const navigate = useNavigate()
  const { user, updateUser } = useUser()
  const [income, setIncome] = useState(user?.income ?? 0)
  const [balance, setBalance] = useState(user?.balance ?? 0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(user?.monthlyExpenses ?? 0)
  const [savingsRate, setSavingsRate] = useState(user?.savingsRate ?? 20)
  const [goalAmount, setGoalAmount] = useState(user?.goalAmount ?? 0)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    updateUser({
      income: Number(income) || 0,
      balance: Number(balance) || 0,
      monthlyExpenses: Number(monthlyExpenses) || 0,
      savingsRate: Math.min(100, Math.max(0, Number(savingsRate) || 0)),
      goalAmount: Number(goalAmount) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="financial-settings-page">
      <h1 className="page-title">Financial settings</h1>
      <p className="page-subtitle">Update your income, expenses, and goals. Changes reflect on the Dashboard.</p>

      <form onSubmit={handleSave} className="financial-settings-form">
        <label className="settings-field">
          <span>Monthly income (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={income || ''}
            onChange={(e) => setIncome(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>
        <label className="settings-field">
          <span>Current balance (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={balance || ''}
            onChange={(e) => setBalance(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>
        <label className="settings-field">
          <span>Monthly expenses (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={monthlyExpenses || ''}
            onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>
        <label className="settings-field">
          <span>Savings rate (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={savingsRate ?? ''}
            onChange={(e) => setSavingsRate(Number(e.target.value) ?? 0)}
            placeholder="20"
          />
        </label>
        <label className="settings-field">
          <span>Goal amount (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={goalAmount || ''}
            onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>
        <div className="settings-actions">
          <button type="submit" className="settings-save-btn">
            {saved ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="settings-back-btn">
            Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  )
}
