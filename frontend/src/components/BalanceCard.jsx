import './BalanceCard.css'

export default function BalanceCard({ amount, subtitle }) {
  const value =
    amount != null
      ? `₹${Number(amount).toLocaleString('en-IN')}`
      : '—'

  return (
    <div className="balance-card">
      <span className="balance-label">Available balance</span>
      <span className="balance-amount">{value}</span>
      {subtitle && <span className="balance-subtitle">{subtitle}</span>}
    </div>
  )
}
