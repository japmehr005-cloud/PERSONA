import { useUser } from '../context/UserContext'
import ExpenseList from '../components/ExpenseList'
import './Expenses.css'

export default function Expenses() {
  const { user, updateUser } = useUser()

  const handleUpdate = (updates) => {
    updateUser(updates)
  }

  return (
    <div className="expenses-page">
      <h1 className="page-title">Expenses</h1>
      <p className="page-subtitle">Manage recurring monthly expenses. Total updates automatically.</p>
      <ExpenseList expenses={user?.recurringExpenses} onUpdate={handleUpdate} />
    </div>
  )
}
