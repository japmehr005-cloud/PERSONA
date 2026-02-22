import { useState } from 'react'
import './PersonaAI.css'

export default function PersonaAI() {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setInput('')
  }

  return (
    <div className="persona-ai-page">
      <h1 className="page-title">Persona AI</h1>
      <p className="page-subtitle ai-label">AI Assistant coming soon</p>

      <div className="chat-container">
        <div className="chat-messages">
          <div className="chat-message chat-message-bot">
            <p>Hi! I’m your Persona AI assistant. Ask me about your finances, goals, or habits once I’m live.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="chat-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            disabled
          />
          <button type="submit" className="chat-send" disabled>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
