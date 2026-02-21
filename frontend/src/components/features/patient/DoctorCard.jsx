import React from 'react'

export default function DoctorCard({ doctor, onClick }) {
  return (
    <div className="doctor-card" onClick={onClick}>
      <div className="doctor-avatar">👨‍⚕️</div>
      <div className="doctor-info">
        <div className="doctor-name">{doctor.name}</div>
        <div className="doctor-meta">
          {doctor.hospital} • {doctor.status === 'active' ? 'Access Active' : 'Access Revoked'}
        </div>
      </div>
      <div className={`status-indicator ${doctor.status !== 'active' ? 'inactive' : ''}`}></div>
    </div>
  )
}