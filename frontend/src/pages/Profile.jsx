import { useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import { simulateSecurity } from '../api'
import FinancialSettings from './FinancialSettings'
import './Profile.css'

const BADGES = [
  { months: 1, name: 'First Step' },
  { months: 3, name: 'Consistent Saver' },
  { months: 5, name: 'Five-Month Streak' },
  { months: 6, name: 'Half-Year Hero' },
  { months: 12, name: 'Year-Long Champion' },
]

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="profile-toggle-row">
      <span className="profile-toggle-label">{label}</span>
      <div className="profile-toggle-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="profile-toggle-slider" />
      </div>
    </label>
  )
}

export default function Profile() {
  const { user, updateUser } = useUser()
  const [investmentSize, setInvestmentSize] = useState(0)
  const [rapidActions, setRapidActions] = useState(false)
  const [securityResult, setSecurityResult] = useState(null)
  const [secLoading, setSecLoading] = useState(false)
  const [secError, setSecError] = useState(null)

  const income = user?.income ?? 0
  const recurringExpenses = Array.isArray(user?.recurringExpenses) ? user.recurringExpenses : []
  const totalExpenses = recurringExpenses.length
    ? recurringExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    : (user?.monthlyExpenses ?? 0)
  const savings = Math.max(0, income - totalExpenses)
  const savingsRatePct = income > 0 ? (savings / income) * 100 : 0
  const healthScore = user?.healthScore != null ? user.healthScore : Math.min(100, Math.round(savingsRatePct * 1.2 + 20))
  const streakMonths = user?.streak ?? 0
  const points = user?.points ?? 0
  const earnedBadges = BADGES.filter((b) => streakMonths >= b.months)
  const nextBadge = BADGES.find((b) => b.months > streakMonths) || BADGES[BADGES.length - 1]
  const progress = nextBadge ? (streakMonths / nextBadge.months) * 100 : 100

  const runSecurityCheck = useCallback(async () => {
    setSecLoading(true)
    setSecError(null)
    setSecurityResult(null)
    try {
      const twoFactorEnabled = user?.smsEnabled || user?.authenticatorEnabled
      const data = await simulateSecurity({
        deviceTrusted: user?.deviceTrusted ?? true,
        twoFactorEnabled: Boolean(twoFactorEnabled),
        unusualAlerts: user?.unusualTransactionAlerts ?? true,
        investmentSize: Number(investmentSize) || 0,
        rapidActions,
      })
      setSecurityResult(data)
    } catch (e) {
      setSecError(e.message)
    } finally {
      setSecLoading(false)
    }
  }, [user, investmentSize, rapidActions])

  const riskClass = securityResult?.riskLevel === 'Secure' ? 'secure' : securityResult?.riskLevel === 'Elevated' ? 'elevated' : 'high'

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile</h1>

      <section className="profile-section">
        <h2 className="profile-section-title">Financial settings</h2>
        <FinancialSettings />
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Security settings</h2>
        <div className="profile-security-block">
          <div className="profile-security-row">
            <span className="profile-security-label">Last login</span>
            <span className="profile-security-value">{user?.lastLoginLocation ?? '—'}</span>
          </div>
          <div className="profile-security-row">
            <span className="profile-security-label">Device</span>
            <span className="profile-security-value">{user?.deviceType ?? '—'}</span>
          </div>
          <ToggleRow label="This device is trusted" checked={user?.deviceTrusted ?? true} onChange={(v) => updateUser({ deviceTrusted: v })} />
          <ToggleRow label="Unusual transaction alerts" checked={user?.unusualTransactionAlerts ?? true} onChange={(v) => updateUser({ unusualTransactionAlerts: v })} />
          <ToggleRow label="Large transaction threshold" checked={user?.largeTransactionAlerts ?? true} onChange={(v) => updateUser({ largeTransactionAlerts: v })} />
          <ToggleRow label="SMS" checked={user?.smsEnabled ?? false} onChange={(v) => updateUser({ smsEnabled: v })} />
          <ToggleRow label="Authenticator app" checked={user?.authenticatorEnabled ?? false} onChange={(v) => updateUser({ authenticatorEnabled: v })} />
        </div>
        <div className="profile-security-check">
          <label>
            <span>Investment size (₹)</span>
            <input type="number" min={0} step={1} value={investmentSize || ''} onChange={(e) => setInvestmentSize(Number(e.target.value) || 0)} />
          </label>
          <ToggleRow label="Rapid actions" checked={rapidActions} onChange={setRapidActions} />
          <button type="button" onClick={runSecurityCheck} disabled={secLoading} className="profile-security-btn">
            {secLoading ? 'Checking…' : 'Check security'}
          </button>
        </div>
        {secError && <p className="profile-error">{secError}</p>}
        {securityResult && (
          <div className={`profile-risk-card profile-risk-${riskClass}`}>
            <p><strong>{securityResult.riskScore}/100</strong> · {securityResult.riskLevel}</p>
            <p className="profile-risk-rec">{securityResult.recommendation}</p>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Streak & badges</h2>
        <div className="profile-streak-hero">
          <div>
            <span className="profile-streak-num">{streakMonths}</span>
            <span className="profile-streak-unit"> months</span>
          </div>
          <div>
            <span className="profile-points-num">{points}</span>
            <span className="profile-points-unit"> points</span>
          </div>
        </div>
        <div className="profile-progress">
          <span>Next: {nextBadge?.name} ({nextBadge?.months} mo)</span>
          <div className="profile-progress-bar">
            <div className="profile-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>
        <div className="profile-badges">
          {earnedBadges.length > 0 ? earnedBadges.map((b) => <span key={b.months} className="profile-badge">{b.name}</span>) : <span className="profile-badges-none">No badges yet</span>}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Health score</h2>
        <div className="profile-health">
          <span className="profile-health-value">{healthScore}</span>
          <span className="profile-health-max">/ 100</span>
        </div>
        <p className="profile-health-desc">Based on your savings rate and financial habits.</p>
      </section>
    </div>
  )
}
