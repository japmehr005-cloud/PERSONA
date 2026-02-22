import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import './ProfileSetup.css'

const RISK_OPTIONS = ['Low', 'Moderate', 'High']

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { user, updateUser } = useUser()
  const [name, setName] = useState(user?.name ?? '')
  const [income, setIncome] = useState(user?.income ?? 0)
  const [balance, setBalance] = useState(user?.balance ?? 0)
  const [savings, setSavings] = useState(user?.savings ?? 0)
  const [goalAmount, setGoalAmount] = useState(user?.goalAmount ?? 0)
  const [goalDeadline, setGoalDeadline] = useState(user?.goalDeadline ?? '')
  const [riskPreference, setRiskPreference] = useState(user?.riskPreference ?? 'Moderate')

  const handleSubmit = (e) => {
    e.preventDefault()
    updateUser({
      name: name.trim(),
      income: Number(income) || 0,
      balance: Number(balance) || 0,
      savings: Number(savings) || 0,
      goalAmount: Number(goalAmount) || 0,
      goalDeadline: goalDeadline.trim(),
      riskPreference: riskPreference,
    })
    navigate('/dashboard')
  }

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-card">
        <h1 className="page-title">Set up your profile</h1>
        <p className="page-subtitle">Tell us a bit about your finances so we can personalize your experience.</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <label className="form-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </label>
          <label className="form-field">
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
          <label className="form-field">
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
          <label className="form-field">
            <span>Savings (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={savings || ''}
              onChange={(e) => setSavings(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </label>
          <label className="form-field">
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
          <label className="form-field">
            <span>Goal deadline</span>
            <input
              type="text"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              placeholder="e.g. 2 years, Dec 2026"
            />
          </label>
          <label className="form-field">
            <span>Risk preference</span>
            <select value={riskPreference} onChange={(e) => setRiskPreference(e.target.value)}>
              {RISK_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="profile-submit-btn">
            Save and continue
          </button>
        </form>
      </div>
    </div>
  )
}
