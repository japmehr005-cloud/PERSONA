import { useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import { simulateSecurity } from '../api'
import './Security.css'

function Section({ title, children }) {
  return (
    <section className="security-section">
      <h2 className="security-section-title">{title}</h2>
      {children}
    </section>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="security-toggle-row">
      <span className="security-toggle-label">{label}</span>
      <div className="security-toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="security-toggle-slider" />
      </div>
    </label>
  )
}

export default function Security() {
  const { user, updateUser } = useUser()
  const [investmentSize, setInvestmentSize] = useState(0)
  const [rapidActions, setRapidActions] = useState(false)
  const [securityResult, setSecurityResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const twoFactorEnabled = user?.smsEnabled || user?.authenticatorEnabled
  const trustedDevices = Array.isArray(user?.trustedDevices) ? user.trustedDevices : []
  const activeSessions = Array.isArray(user?.activeSessions) ? user.activeSessions : []

  const runRiskCheck = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSecurityResult(null)
    try {
      const data = await simulateSecurity({
        deviceTrusted: user?.deviceTrusted ?? true,
        twoFactorEnabled: Boolean(twoFactorEnabled),
        unusualAlerts: user?.unusualTransactionAlerts ?? true,
        investmentSize: Number(investmentSize) || 0,
        rapidActions,
      })
      setSecurityResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, investmentSize, rapidActions, twoFactorEnabled])

  const riskScore = securityResult?.riskScore ?? null
  const riskLevelClass =
    securityResult?.riskLevel === 'Secure'
      ? 'secure'
      : securityResult?.riskLevel === 'Elevated'
        ? 'elevated'
        : securityResult?.riskLevel === 'High Risk'
          ? 'high'
          : ''

  return (
    <div className="security-page">
      <h1 className="page-title">Security</h1>
      <p className="page-subtitle">Account protection and risk monitoring.</p>

      <Section title="Account protection">
        <ToggleRow
          label="Two-factor authentication"
          checked={user?.authenticatorEnabled ?? false}
          onChange={(v) => updateUser({ authenticatorEnabled: v })}
        />
        <ToggleRow
          label="SMS verification"
          checked={user?.smsEnabled ?? false}
          onChange={(v) => updateUser({ smsEnabled: v })}
        />
        <ToggleRow
          label="Biometric login"
          checked={user?.biometricEnabled ?? false}
          onChange={(v) => updateUser({ biometricEnabled: v })}
        />
        <div className="security-info-row">
          <span className="security-info-label">Last login</span>
          <span className="security-info-value">{user?.lastLoginLocation ?? '—'}</span>
        </div>
        <div className="security-info-row">
          <span className="security-info-label">Active sessions</span>
          <span className="security-info-value">{activeSessions.length || 1}</span>
        </div>
        {trustedDevices.length > 0 && (
          <div className="security-list-block">
            <span className="security-info-label">Trusted devices</span>
            <ul className="security-list">
              {trustedDevices.map((d, i) => (
                <li key={i}>{typeof d === 'string' ? d : d.name ?? 'Device'}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Risk monitoring">
        <div className="security-risk-inputs">
          <label className="security-input-row">
            <span>Investment size (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={investmentSize || ''}
              onChange={(e) => setInvestmentSize(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </label>
          <ToggleRow label="Rapid action detected" checked={rapidActions} onChange={setRapidActions} />
        </div>
        <button onClick={runRiskCheck} disabled={loading} className="security-check-btn">
          {loading ? 'Checking…' : 'Update risk score'}
        </button>
        {error && <div className="security-error">{error}</div>}
        {securityResult && (
          <div className={`security-risk-card security-risk-${riskLevelClass}`}>
            <div className="security-risk-header">
              <span className="security-risk-score">{Math.round(riskScore)}</span>
              <span className="security-risk-max">/ 100</span>
            </div>
            <span className="security-risk-label">Overall risk score</span>
            <div className="security-risk-bar">
              <div
                className="security-risk-fill"
                style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
              />
            </div>
            <div className="security-risk-detail">
              <span>Device trust</span>
              <span>{user?.deviceTrusted ? 'Trusted' : 'Not trusted'}</span>
            </div>
            <div className="security-risk-detail">
              <span>Location</span>
              <span>{user?.lastLoginLocation ?? '—'}</span>
            </div>
            <div className="security-risk-detail">
              <span>Rapid action</span>
              <span>{rapidActions ? 'Yes' : 'No'}</span>
            </div>
            <p className="security-risk-recommendation">{securityResult.recommendation}</p>
          </div>
        )}
      </Section>

      <Section title="Transaction alerts">
        <ToggleRow
          label="Large transaction alert"
          checked={user?.largeTransactionAlerts ?? true}
          onChange={(v) => updateUser({ largeTransactionAlerts: v })}
        />
        <ToggleRow
          label="New device login alert"
          checked={user?.newDeviceLoginAlert ?? true}
          onChange={(v) => updateUser({ newDeviceLoginAlert: v })}
        />
        <ToggleRow
          label="Suspicious activity detection"
          checked={user?.unusualTransactionAlerts ?? true}
          onChange={(v) => updateUser({ unusualTransactionAlerts: v })}
        />
      </Section>
    </div>
  )
}
