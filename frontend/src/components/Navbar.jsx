import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { sessionUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">
        Persona
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/simulation" className={({ isActive }) => (isActive ? 'active' : '')}>
          Simulation
        </NavLink>
        <NavLink to="/streaks" className={({ isActive }) => (isActive ? 'active' : '')}>
          Streaks
        </NavLink>
        {sessionUser?.name && <span className="navbar-user">{sessionUser.name}</span>}
        <button type="button" className="navbar-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  )
}
