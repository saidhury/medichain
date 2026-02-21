import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'
import DoctorModal from './DoctorModal.jsx'

export default function DoctorsList() {
  const { account, addLog } = useWeb3()
  const { getAuthorizedDoctors, revokeAccess, loading } = useMedicalRecords()
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDoctors = useCallback(async () => {
    if (!account) {
      console.warn('[DoctorsList] No account available')
      return
    }

    setIsLoading(true)
    addLog('Loading authorized doctors...', 'info')
    console.info('[DoctorsList] Fetching doctors for:', account)

    try {
      // Get addresses from blockchain
      const addresses = await getAuthorizedDoctors(account)
      console.info('[DoctorsList] Found addresses:', addresses)

      // Enrich with backend data
      const enrichedDoctors = await Promise.all(
        addresses.map(async (addr, idx) => {
          try {
            const userData = await apiService.getUser(addr)
            return {
              address: addr,
              name: userData.name || `Doctor ${idx + 1}`,
              hospital: userData.hospital || 'Unknown Hospital',
              specialty: userData.specialty || 'General Medicine',
              status: 'active',
              grantedDate: new Date().toISOString().split('T')[0], // Would come from events
              expiry: 'Permanent',
              recordsAccessed: 0,
              lastActive: 'Never',
            }
          } catch (err) {
            console.warn('[DoctorsList] Failed to enrich doctor:', addr, err.message)
            return {
              address: addr,
              name: `Doctor ${addr.slice(0, 6)}...${addr.slice(-4)}`,
              hospital: 'Unknown Hospital',
              specialty: 'General Medicine',
              status: 'active',
              grantedDate: new Date().toISOString().split('T')[0],
              expiry: 'Permanent',
              recordsAccessed: 0,
              lastActive: 'Never',
            }
          }
        })
      )

      console.info('[DoctorsList] Enriched doctors:', enrichedDoctors)
      setDoctors(enrichedDoctors)
      addLog(`Loaded ${enrichedDoctors.length} authorized doctors`, 'info')
    } catch (err) {
      console.error('[DoctorsList] Failed to load doctors:', err)
      addLog('Failed to load doctors', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [account, getAuthorizedDoctors, addLog])

  useEffect(() => {
    loadDoctors()
  }, [loadDoctors])

  const handleRevoke = async (address) => {
    const success = await revokeAccess(address)
    if (success) {
      loadDoctors()
    }
  }

  return (
    <Card>
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <span>My Care Team</span>
        <Button 
          onClick={loadDoctors} 
          loading={isLoading || loading}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          Refresh
        </Button>
      </div>
      <div className="info-text">
        Doctors who currently have access to your medical history across all hospitals and clinics.
      </div>
      
      {isLoading ? (
        <div className="empty">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="empty">No authorized doctors found. Grant access to add doctors to your care team.</div>
      ) : (
        doctors.map((doc, idx) => (
          <div 
            key={idx} 
            className="doctor-card" 
            onClick={() => setSelectedDoctor(doc)}
          >
            <div className="doctor-avatar">👨‍⚕️</div>
            <div className="doctor-info">
              <div className="doctor-name">{doc.name}</div>
              <div className="doctor-meta">
                {doc.hospital} • {doc.status === 'active' ? 'Access Active' : 'Access Revoked'}
              </div>
            </div>
            <div className={`status-indicator ${doc.status !== 'active' ? 'inactive' : ''}`}></div>
          </div>
        ))
      )}

      {selectedDoctor && (
        <DoctorModal 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
          onRevoke={handleRevoke}
        />
      )}
    </Card>
  )
}