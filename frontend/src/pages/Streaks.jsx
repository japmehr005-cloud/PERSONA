import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Streaks.css'

const BADGE_DISPLAY = [
  { id: 'first_investment', name: 'First Investment' },
  { id: '3_month', name: '3 Month Consistency' },
  { id: '6_month', name: '6 Month Discipline' },
  { id: '1_year', name: '1 Year Investor' },
  { id: 'goal_achiever', name: 'Goal Achiever' },
  { id: '1l_milestone', name: '₹1L Invested Milestone' },
]

export default function Streaks() {
  const { loadDashboard, dashboard } = useAuth()
  const [streaks, setStreaks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStreaks()
      .then(setStreaks)
      .catch(() => setStreaks(null))
      .finally(() => setLoading(false))
  }, [dashboard?.streak?.points, dashboard?.streak?.monthsActive])

  const d = dashboard || {}
  const streakData = streaks || d.streak || {}
  const monthsActive = streakData.monthsActive ?? 0
  const points = streakData.points ?? 0
  const badgeIds = streakData.badges || []
  const badgeNames = streakData.badgeNames || BADGE_DISPLAY.filter((b) => badgeIds.includes(b.id)).map((b) => b.name)

  if (loading && !streaks) {
    return <div className="streaks-page"><p className="streaks-loading">Loading…</p></div>
  }

  return (
    <div className="streaks-page">
      <h1 className="page-title">Streaks & badges</h1>
      <p className="page-subtitle">Invest at least once per month to keep your streak. Backend-owned.</p>

      <section className="streaks-hero">
        <div className="streak-display">
          <span className="streak-number">{monthsActive}</span>
          <span className="streak-unit">months</span>
          <p className="streak-label">Current streak</p>
        </div>
        <div className="points-display">
          <span className="points-number">{points}</span>
          <span className="points-unit">points</span>
        </div>
      </section>

      <section className="streaks-badges">
        <h2 className="streaks-section-title">Badges</h2>
        <ul className="badge-list">
          {BADGE_DISPLAY.map((b) => (
            <li key={b.id} className={badgeIds.includes(b.id) ? 'earned' : ''}>
              <span className="badge-name">{b.name}</span>
              {badgeIds.includes(b.id) ? <span className="badge-check">✓</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="streaks-rules">
        +10 per investment, +5 on-time monthly, +20 for hitting savings target. Streak resets if you miss a full month without investing.
      </p>
    </div>
  )
}
