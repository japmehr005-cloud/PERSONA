import './InvestmentList.css'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function InvestmentList({ investments, onRemove }) {
  const list = Array.isArray(investments) ? investments : []

  if (list.length === 0) {
    return (
      <div className="investment-list">
        <p className="investment-list-empty">No active SIP plans. Add one below.</p>
      </div>
    )
  }

  return (
    <div className="investment-list">
      <ul className="investment-list-ul">
        {list.map((inv, index) => (
          <li key={index} className="investment-list-item">
            <div className="investment-list-item-main">
              <span className="investment-list-item-sip">₹{(inv.sipAmount ?? 0).toLocaleString('en-IN')}/mo</span>
              <span className="investment-list-item-risk">{inv.riskLevel ?? '—'}</span>
              <span className="investment-list-item-duration">{inv.durationYears ?? 0} yrs</span>
              <span className="investment-list-item-projected">₹{(inv.projectedValue ?? 0).toLocaleString('en-IN')}</span>
              <span className="investment-list-item-date">{formatDate(inv.startDate)}</span>
            </div>
            <button type="button" onClick={() => onRemove(index)} className="investment-list-remove-btn">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
