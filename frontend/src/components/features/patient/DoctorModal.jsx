import React from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Modal from '@components/ui/Modal.jsx'
import Button from '@components/ui/Button.jsx'

export default function DoctorModal({ doctor, onClose, onRevoke }) {
  const { addLog } = useWeb3()

  const handleRevoke = () => {
    if (confirm(`Revoke access from ${doctor.name}?`)) {
      addLog(`Revoking access from ${doctor.name}...`, 'warn')
      // In production: call contract.revokeAccess(doctor.address)
      onClose()
      onRevoke()
    }
  }

  const handleExtend = () => {
    addLog(`Extending access for ${doctor.name}...`, 'info')
    onClose()
  }

  const handleViewHistory = () => {
    addLog(`Viewing access history for ${doctor.name}...`, 'info')
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Doctor Details">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="doctor-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 16px' }}>
          👨‍⚕️
        </div>
        <div className="doctor-name" style={{ fontSize: '1.25rem' }}>{doctor.name}</div>
        <div className="doctor-meta">{doctor.hospital}</div>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">Wallet Address</span>
        <span className="detail-value">{doctor.address}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Hospital/Clinic</span>
        <span className="detail-value">{doctor.hospital}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Access Granted</span>
        <span className="detail-value">{doctor.grantedDate}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Access Expires</span>
        <span className="detail-value">{doctor.expiry}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Records Accessed</span>
        <span className="detail-value">{doctor.recordsAccessed}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Last Active</span>
        <span className="detail-value">{doctor.lastActive}</span>
      </div>
      
      <div className="quick-actions">
        <Button onClick={handleViewHistory} secondary>
          View History
        </Button>
        <Button onClick={handleExtend} primary>
          Extend Access
        </Button>
        <Button onClick={handleRevoke} danger>
          Revoke Access
        </Button>
      </div>
    </Modal>
  )
}