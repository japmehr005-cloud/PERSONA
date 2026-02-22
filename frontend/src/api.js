/**
 * Persona API – backend is single source of truth.
 * All requests use session (Bearer token) except login.
 */

const API_BASE = "http://127.0.0.1:8000"

function getSession() {
  return localStorage.getItem('persona_session') || ''
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' }
  if (includeAuth) {
    const session = getSession()
    if (session) h['Authorization'] = `Bearer ${session}`
  }
  return h
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function login(name, password = '') {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: headers(false),
    body: JSON.stringify({ name: (name || '').trim(), password }),
  })
  const data = await handleResponse(res)
  if (data.sessionId) localStorage.setItem('persona_session', data.sessionId)
  return data
}

export function logout() {
  localStorage.removeItem('persona_session')
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/me`, { headers: headers() })
  return handleResponse(res)
}

export async function setup(body) {
  const res = await fetch(`${API_BASE}/setup`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function getDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`, { headers: headers() })
  return handleResponse(res)
}

export async function addInvestment(body) {
  const res = await fetch(`${API_BASE}/investments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function addTransaction(body) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function simulateSip(body) {
  const res = await fetch(`${API_BASE}/simulation/sip`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function simulatePurchase(body) {
  const res = await fetch(`${API_BASE}/simulation/purchase`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function applySimulation(body) {
  const res = await fetch(`${API_BASE}/simulation/apply`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function getStreaks() {
  const res = await fetch(`${API_BASE}/streaks`, { headers: headers() })
  return handleResponse(res)
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`)
  return handleResponse(res)
}
