import { useState } from 'react'
import './ExpenseList.css'

export default function ExpenseList({ expenses, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')

  const list = Array.isArray(expenses) ? expenses : []

  const total = list.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  const handleAdd = (e) => {
    e.preventDefault()
    const name = addName.trim()
    const amount = Number(addAmount)
    if (!name || amount <= 0) return
    const next = [...list, { name, amount }]
    syncExpenses(next)
    setAddName('')
    setAddAmount('')
  }

  const startEdit = (index) => {
    const e = list[index]
    setEditingId(index)
    setEditName(e?.name ?? '')
    setEditAmount(e?.amount ?? 0)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    const name = editName.trim()
    const amount = Number(editAmount)
    if (!name || amount <= 0) {
      setEditingId(null)
      return
    }
    const next = list.map((item, i) => (i === editingId ? { name, amount } : item))
    syncExpenses(next)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleDelete = (index) => {
    const next = list.filter((_, i) => i !== index)
    syncExpenses(next)
    if (editingId === index) setEditingId(null)
    else if (editingId != null && editingId > index) setEditingId(editingId - 1)
  }

  function syncExpenses(next) {
    const totalExpenses = next.reduce((s, x) => s + (Number(x.amount) || 0), 0)
    onUpdate({ recurringExpenses: next, monthlyExpenses: totalExpenses })
  }

  return (
    <div className="expense-list">
      <div className="expense-list-total">
        <span className="expense-list-total-label">Total monthly expenses</span>
        <span className="expense-list-total-value">₹{total.toLocaleString('en-IN')}</span>
      </div>

      <form onSubmit={handleAdd} className="expense-list-add">
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          placeholder="Expense name"
          className="expense-list-input-name"
        />
        <input
          type="number"
          min={0}
          step={1}
          value={addAmount || ''}
          onChange={(e) => setAddAmount(e.target.value)}
          placeholder="Amount"
          className="expense-list-input-amount"
        />
        <button type="submit" className="expense-list-add-btn">Add</button>
      </form>

      <ul className="expense-list-ul">
        {list.map((item, index) => (
          <li key={index} className="expense-list-item">
            {editingId === index ? (
              <form onSubmit={saveEdit} className="expense-list-edit">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="expense-list-input-name"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editAmount || ''}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="expense-list-input-amount"
                />
                <button type="submit" className="expense-list-save-btn">Save</button>
                <button type="button" onClick={cancelEdit} className="expense-list-cancel-btn">Cancel</button>
              </form>
            ) : (
              <>
                <span className="expense-list-item-name">{item.name}</span>
                <span className="expense-list-item-amount">₹{(item.amount ?? 0).toLocaleString('en-IN')}</span>
                <div className="expense-list-item-actions">
                  <button type="button" onClick={() => startEdit(index)} className="expense-list-edit-btn">Edit</button>
                  <button type="button" onClick={() => handleDelete(index)} className="expense-list-delete-btn">Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="expense-list-empty">No recurring expenses. Add one above.</p>
      )}
    </div>
  )
}
