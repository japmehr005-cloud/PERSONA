import { Link } from 'react-router-dom'
import './ActiveInvestments.css'

export default function ActiveInvestments({ investments }) {
  const list = Array.isArray(investments) ? investments : []
  const totalSip = list.reduce((sum, inv) => sum + (inv.sipAmount ?? 0), 0)
  const totalProjected = list.reduce((sum, inv) => sum + (inv.projectedValue ?? 0), 0)

  if (list.length === 0) {
    return (
      <div className="active-investments">
        <h2 className="active-investments-title">Active investments</h2>
        <p className="active-investments-empty">No active SIPs. <Link to="/invest">Start investing</Link>.</p>
      </div>
    )
  }

  return (
    <div className="active-investments">
      <h2 className="active-investments-title">Active investments</h2>
      <div className="active-investments-summary">
        <div className="active-summary-item">
          <span className="active-summary-label">Total monthly SIP</span>
          <span className="active-summary-value">₹{totalSip.toLocaleString('en-IN')}</span>
        </div>
        <div className="active-summary-item">
          <span className="active-summary-label">Total projected value</span>
          <span className="active-summary-value">₹{totalProjected.toLocaleString('en-IN')}</span>
        </div>
        <div className="active-summary-item">
          <span className="active-summary-label">Active count</span>
          <span className="active-summary-value">{list.length}</span>
        </div>
      </div>
      <Link to="/invest" className="active-investments-link">Manage investments →</Link>
    </div>
  )
}
