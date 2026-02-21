import React from 'react'

export default function Badge({ 
  children, 
  connected = false, 
  onClick, 
  className = '' 
}) {
  const classes = [
    'badge',
    connected ? 'connected' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classes} onClick={onClick}>
      {children}
    </span>
  )
}