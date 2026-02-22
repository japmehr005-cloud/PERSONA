import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import Simulation from './pages/Simulation'
import Streaks from './pages/Streaks'
import './App.css'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="app-main">{children}</main>
    </>
  )
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute requireSetup={false}>
              <Layout>
                <Setup />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation"
          element={
            <ProtectedRoute>
              <Layout>
                <Simulation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/streaks"
          element={
            <ProtectedRoute>
              <Layout>
                <Streaks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}
