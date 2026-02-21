import React from 'react'

export default function Button({ 
  children, 
  onClick, 
  primary = false, 
  secondary = false, 
  danger = false, 
  ghost = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  style = {}
}) {
  const className = [
    primary ? 'primary' : '',
    secondary ? 'secondary' : '',
    danger ? 'danger' : '',
    ghost ? 'ghost' : '',
    fullWidth ? 'full-width' : ''
  ].filter(Boolean).join(' ')

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={style}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}