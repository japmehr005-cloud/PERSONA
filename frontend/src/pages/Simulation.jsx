import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Simulation.css'

export default function Simulation() {
  const { loadDashboard } = useAuth()
  const [mode, setMode] = useState('sip')
  const [sipAmount, setSipAmount] = useState('')
  const [sipRisk, setSipRisk] = useState('moderate')
  const [sipDuration, setSipDuration] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [sipResult, setSipResult] = useState(null)
  const [purchaseResult, setPurchaseResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)

  const runSipSim = async () => {
    const amount = Number(sipAmount) || 0
    const dur = Number(sipDuration) || 0
    if (amount <= 0 || dur < 0.1) return
    setError('')
    setLoading(true)
    setSipResult(null)
    setPurchaseResult(null)
    try {
      const data = await api.simulateSip({
        sipAmount: amount,
        riskLevel: sipRisk,
        durationYears: dur,
      })
      setSipResult(data)
    } catch (e) {
      setError(e.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const runPurchaseSim = async () => {
    const amount = Number(purchaseAmount) || 0
    if (amount <= 0) return
    setError('')
    setLoading(true)
    setSipResult(null)
    setPurchaseResult(null)
    try {
      const data = await api.simulatePurchase({ amount })
      setPurchaseResult(data)
    } catch (e) {
      setError(e.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const applySip = async () => {
    if (!sipResult) return
    setApplyLoading(true)
    setError('')
    try {
      await api.applySimulation({
        type: 'sip',
        sipAmount: Number(sipAmount) || 0,
        riskLevel: sipRisk,
        durationYears: Number(sipDuration) || 0,
      })
      await loadDashboard()
      setSipResult(null)
      setSipAmount('')
      setSipDuration('')
    } catch (e) {
      setError(e.message || 'Apply failed')
    } finally {
      setApplyLoading(false)
    }
  }

  const applyPurchase = async () => {
    if (!purchaseResult) return
    setApplyLoading(true)
    setError('')
    try {
      await api.applySimulation({
        type: 'purchase',
        amount: Number(purchaseAmount) || 0,
      })
      await loadDashboard()
      setPurchaseResult(null)
      setPurchaseAmount('')
    } catch (e) {
      setError(e.message || 'Apply failed')
    } finally {
      setApplyLoading(false)
    }
  }

  const discard = () => {
    setSipResult(null)
    setPurchaseResult(null)
    setSipAmount('')
    setSipDuration('')
    setPurchaseAmount('')
    setError('')
  }

  const hasSim = sipResult || purchaseResult

  return (
    <div className="simulation-page">
      <h1 className="page-title">Simulation</h1>
      <p className="page-subtitle">What-if only. Apply to real data when ready.</p>

      <div className="simulation-tabs">
        <button type="button" className={`simulation-tab ${mode === 'sip' ? 'active' : ''}`} onClick={() => setMode('sip')}>
          New SIP
        </button>
        <button type="button" className={`simulation-tab ${mode === 'purchase' ? 'active' : ''}`} onClick={() => setMode('purchase')}>
          Large purchase
        </button>
      </div>

      {mode === 'sip' && (
        <section className="simulation-block">
          <h2 className="simulation-block-title">SIP simulation</h2>
          <p className="simulation-note">Expected returns: Low 6%, Moderate 12%, High 18%</p>
          <div className="simulation-form">
            <label>
              <span>SIP amount (₹/mo)</span>
              <input type="number" min={0} step={1} value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="0" />
            </label>
            <label>
              <span>Risk level</span>
              <select value={sipRisk} onChange={(e) => setSipRisk(e.target.value)}>
                <option value="low">Low (6%)</option>
                <option value="moderate">Moderate (12%)</option>
                <option value="high">High (18%)</option>
              </select>
            </label>
            <label>
              <span>Duration (years)</span>
              <input type="number" min={0.1} step={1} value={sipDuration} onChange={(e) => setSipDuration(e.target.value)} placeholder="0" />
            </label>
          </div>
          <button type="button" onClick={runSipSim} disabled={loading || !sipAmount || !sipDuration} className="simulation-run-btn">
            {loading ? 'Running…' : 'Run simulation'}
          </button>
          {sipResult && (
            <div className="simulation-results">
              <div className="simulation-result-row">
                <span>Projected value</span>
                <span className="simulation-result-value">₹{sipResult.projectedValue?.toLocaleString('en-IN')}</span>
              </div>
              <div className="simulation-result-row">
                <span>Total invested</span>
                <span>₹{sipResult.totalInvested?.toLocaleString('en-IN')}</span>
              </div>
              <div className="simulation-result-row">
                <span>Returns</span>
                <span className="simulation-result-value">₹{sipResult.returns?.toLocaleString('en-IN')}</span>
              </div>
              <div className="simulation-result-row">
                <span>Goal timeline impact</span>
                <span>{sipResult.goalTimelineImpactMonths ?? 0} months</span>
              </div>
              <div className="simulation-result-row">
                <span>New monthly liquidity</span>
                <span>₹{sipResult.newMonthlyLiquidity?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {mode === 'purchase' && (
        <section className="simulation-block">
          <h2 className="simulation-block-title">Purchase simulation</h2>
          <div className="simulation-form">
            <label>
              <span>Amount (₹)</span>
              <input type="number" min={0} step={1} value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} placeholder="0" />
            </label>
          </div>
          <button type="button" onClick={runPurchaseSim} disabled={loading || !purchaseAmount} className="simulation-run-btn">
            {loading ? 'Running…' : 'Run simulation'}
          </button>
          {purchaseResult && (
            <div className="simulation-results">
              <div className="simulation-result-row">
                <span>Balance after</span>
                <span className="simulation-result-value">₹{purchaseResult.balanceAfter?.toLocaleString('en-IN')}</span>
              </div>
              <div className="simulation-result-row">
                <span>Goal delay</span>
                <span>{purchaseResult.goalDelayMonths ?? 0} months</span>
              </div>
              {purchaseResult.streakBreakWarning && (
                <p className="simulation-warning">This may affect your streak.</p>
              )}
            </div>
          )}
        </section>
      )}

      {error && <p className="simulation-error">{error}</p>}

      {hasSim && (
        <section className="simulation-actions">
          <button
            type="button"
            className="simulation-apply-btn"
            disabled={applyLoading}
            onClick={() => { if (sipResult) applySip(); else if (purchaseResult) applyPurchase(); }}
          >
            {applyLoading ? 'Applying…' : 'Apply to real data'}
          </button>
          <button type="button" className="simulation-clear-btn" onClick={discard}>
            Discard simulation
          </button>
        </section>
      )}
    </div>
  )
}
