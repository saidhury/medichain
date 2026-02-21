import React, { useState, useEffect } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'

export default function AccessRequests() {
  const { account, addLog } = useWeb3()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!account) return
      setLoading(true)
      try {
        // This endpoint doesn't exist yet in your backend
        setRequests([])
      } catch (err) {
        console.log('No access requests endpoint yet')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [account])

  const handleApprove = async (patientAddress) => {
    addLog(`Approving access request from ${patientAddress.slice(0, 10)}...`, 'info')
  }

  const handleReject = async (patientAddress) => {
    addLog(`Rejecting access request from ${patientAddress.slice(0, 10)}...`, 'info')
  }

  return (
    <Card>
      <div className="section-title">Pending Access Requests</div>
      <div className="info-text">
        Patients requesting you to view their records for consultation.
      </div>
      
      {loading ? (
        <div className="empty">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty">No pending access requests</div>
      ) : (
        requests.map((request, idx) => (
          <div key={idx} className="doctor-card" style={{ marginBottom: '8px' }}>
            <div className="doctor-avatar">👤</div>
            <div className="doctor-info">
              <div className="doctor-name">{request.patientName || 'Unknown Patient'}</div>
              <div className="doctor-meta">
                {request.patientAddress?.slice(0, 20)}... • Requested: {request.date}
              </div>
            </div>
            <div className="flex-row">
              <Button onClick={() => handleApprove(request.patientAddress)} secondary style={{ padding: '6px 12px' }}>
                Approve
              </Button>
              <Button onClick={() => handleReject(request.patientAddress)} danger style={{ padding: '6px 12px' }}>
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}