import React from 'react'

export default function Navigation({ activeRole, onRoleChange }) {
  return (
    <div className="nav-tabs">
      <button 
        id="tabPatient" 
        onClick={() => onRoleChange('patient')}
        className={activeRole === 'patient' ? 'active' : ''}
      >
        Patient Portal
      </button>
      <button 
        id="tabDoctor" 
        onClick={() => onRoleChange('doctor')}
        className={activeRole === 'doctor' ? 'active' : ''}
      >
        Doctor Portal
      </button>
    </div>
  )
}