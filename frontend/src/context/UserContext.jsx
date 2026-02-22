import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'persona_user'

const DEFAULT_USER = {
  name: '',
  income: 0,
  balance: 0,
  savings: 0,
  goalAmount: 0,
  goalDeadline: '',
  riskPreference: 'Moderate',
  streak: 0,
  points: 0,
  deviceTrusted: true,
  twoFactorEnabled: false,
  unusualTransactionAlerts: true,
  lastLoginLocation: 'Mumbai, India',
  deviceType: 'Mobile',
  largeTransactionAlerts: true,
  smsEnabled: false,
  authenticatorEnabled: false,
  monthlyExpenses: 0,
  savingsRate: 20,
  investments: [],
  transactions: [],
  recurringExpenses: [],
  monthlySavingsTarget: 0,
  biometricEnabled: false,
  trustedDevices: [],
  activeSessions: [],
  newDeviceLoginAlert: true,
}

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_USER, ...parsed }
  } catch {
    return null
  }
}

function saveUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (e) {
    console.warn('Failed to save user to localStorage', e)
  }
}

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const loaded = loadUser()
    if (loaded) return loaded
    const defaultProfile = { ...DEFAULT_USER }
    saveUser(defaultProfile)
    return defaultProfile
  })

  const updateUser = useCallback((updates) => {
    setUserState((prev) => {
      const next = { ...prev, ...updates }
      saveUser(next)
      return next
    })
  }, [])

  const hasProfile = useMemo(() => Boolean(user?.name?.trim()), [user?.name])

  const value = useMemo(
    () => ({ user, updateUser, hasProfile }),
    [user, updateUser, hasProfile]
  )

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
