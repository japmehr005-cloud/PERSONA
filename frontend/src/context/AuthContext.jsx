import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import * as api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessionUser, setSessionUser] = useState(null) // { id, name, setupDone } from login
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const hasSession = useMemo(() => {
    if (typeof localStorage === 'undefined') return false
    return Boolean(localStorage.getItem('persona_session'))
  }, [sessionUser])

  useEffect(() => {
    if (!hasSession) {
      setAuthChecked(true)
      return
    }
  
    api.getMe()
      .then((user) => {
        setSessionUser({
          id: user.id,
          name: user.name,
          setupDone: user.setupDone
        })
      })
      .catch(() => {
        api.logout()
        setSessionUser(null)
      })
      .finally(() => {
        setAuthChecked(true)
      })
  }, [hasSession])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getDashboard()
      setDashboard(data)
      return data
    } catch (e) {
      setError(e.message)
      setDashboard(null)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (name, password) => {
    const data = await api.login(name, password)
    setSessionUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setSessionUser(null)
    setDashboard(null)
  }, [])

  const setup = useCallback(async (body) => {
    const user = await api.setup(body)
    setSessionUser({ id: user.id, name: user.name, setupDone: user.setupDone })
    await loadDashboard()
    return user
  }, [loadDashboard])

  const addInvestment = useCallback(async (body) => {
    await api.addInvestment(body)
    return loadDashboard()
  }, [loadDashboard])

  const addTransaction = useCallback(async (body) => {
    await api.addTransaction(body)
    return loadDashboard()
  }, [loadDashboard])

  const value = useMemo(() => ({
    sessionUser,
    setSessionUser,
    dashboard,
    setDashboard,
    loading,
    error,
    hasSession,
    authChecked,
    login,
    logout,
    setup,
    loadDashboard,
    addInvestment,
    addTransaction,
  }), [sessionUser, dashboard, loading, error, hasSession, authChecked, login, logout, setup, loadDashboard, addInvestment, addTransaction])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
