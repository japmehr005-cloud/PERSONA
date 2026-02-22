import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) {
      setError('Name required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await login(n, password)
      navigate(data.needsSetup ? '/setup' : '/dashboard', { replace: true })
    } catch (e) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">Persona</h1>
        <p className="login-tagline">Your Financial Digital Twin</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="username"
              disabled={loading}
            />
          </label>
          <label className="login-field">
            <span>Password (mock)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
