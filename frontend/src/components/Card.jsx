import { Link } from 'react-router-dom'
import './Card.css'

export default function Card({ to, title, children, variant = 'primary', className = '' }) {
  const content = (
    <>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </>
  )

  const classes = `card card-${variant} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
