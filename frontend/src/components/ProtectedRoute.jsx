import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Requires session. Redirects to /login if not authenticated.
 * If authenticated but !setupDone, redirects to /setup.
 */
export default function ProtectedRoute({ children, requireSetup = true }) {
  const { sessionUser, authChecked } = useAuth()
  const location = useLocation()

  if (!authChecked) {
    return <div className="auth-loading">Loading…</div>
  }

  const session = typeof localStorage !== 'undefined' ? localStorage.getItem('persona_session') : null
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireSetup && sessionUser && !sessionUser.setupDone) {
    return <Navigate to="/setup" state={{ from: location }} replace />
  }

  return children
}
