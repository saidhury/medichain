import React, { useState } from 'react'
import { ethers } from 'ethers'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'
import Input from '@components/ui/Input.jsx'
import Button from '@components/ui/Button.jsx'

export default function GrantAccess({ onGrant }) {
  const { account, userProfile, addLog } = useWeb3()
  const { grantAccess, loading, error } = useMedicalRecords()
  const [formData, setFormData] = useState({
    doctorName: '',
    doctorEmail: '',
    hospital: '',
    walletAddress: '', // Hidden technical field
    duration: 'permanent',
    notes: ''
  })
  const [status, setStatus] = useState('idle')
  const [searching, setSearching] = useState(false)
  const [foundDoctors, setFoundDoctors] = useState([])

  // Search doctor by name/email instead of wallet
  const searchDoctor = async () => {
    if (!formData.doctorName && !formData.doctorEmail) {
      addLog('Please enter doctor name or email', 'error')
      return
    }

    setSearching(true)
    try {
      // This would search your backend for doctors
      const doctors = await apiService.searchDoctors({
        name: formData.doctorName,
        email: formData.doctorEmail,
        hospital: formData.hospital
      })
      setFoundDoctors(doctors)
      if (doctors.length === 0) {
        addLog('No doctors found. Please check details or enter wallet address manually.', 'warn')
      }
    } catch (err) {
      addLog('Search failed', 'error')
    } finally {
      setSearching(false)
    }
  }

  const selectDoctor = (doctor) => {
    setFormData({
      ...formData,
      doctorName: doctor.name,
      hospital: doctor.hospital,
      walletAddress: doctor.wallet_address
    })
    setFoundDoctors([])
    addLog(`Selected: ${doctor.name}`, 'info')
  }

  const handleSubmit = async () => {
    // Fallback: if no wallet address from search, try to use entered value
    let doctorWallet = formData.walletAddress
    
    if (!doctorWallet && formData.doctorEmail) {
      // Try to resolve email to wallet (would need backend support)
      addLog('Resolving doctor...', 'info')
      try {
        const resolved = await apiService.resolveDoctor(formData.doctorEmail)
        doctorWallet = resolved.wallet_address
      } catch (err) {
        addLog('Could not find doctor. Please ask for their ID code.', 'error')
        return
      }
    }

    if (!doctorWallet || !ethers.isAddress(doctorWallet)) {
      addLog('Invalid doctor ID. Please search or enter a valid address.', 'error')
      return
    }

    setStatus('granting')
    try {
      const success = await grantAccess(doctorWallet)
      
      if (success) {
        setStatus('success')
        setFormData({ 
          doctorName: '', 
          doctorEmail: '', 
          hospital: '', 
          walletAddress: '', 
          duration: 'permanent', 
          notes: '' 
        })
        onGrant?.()
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'granting': return 'Granting Access...'
      case 'success': return '✓ Access Granted!'
      case 'error': return 'Failed - Try Again'
      default: return 'Grant Access'
    }
  }

  return (
    <Card>
      <div className="section-title">Share Records With Doctor</div>
      <div className="info-text">
        Search for your doctor by name, email, or hospital. They will be able to view and upload records for you.
      </div>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          background: 'var(--primary-soft)', 
          color: 'var(--primary)',
          borderRadius: '12px',
          marginBottom: '16px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <Input
        placeholder="Doctor's name (e.g., Dr. Shivam Kumar)"
        value={formData.doctorName}
        onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
        disabled={loading}
      />
      
      <Input
        placeholder="Doctor's email"
        type="email"
        value={formData.doctorEmail}
        onChange={(e) => setFormData({...formData, doctorEmail: e.target.value})}
        disabled={loading}
      />
      
      <Input
        placeholder="Hospital or clinic name"
        value={formData.hospital}
        onChange={(e) => setFormData({...formData, hospital: e.target.value})}
        disabled={loading}
      />

      {foundDoctors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="info-text">Select a doctor:</div>
          {foundDoctors.map((doc, idx) => (
            <div 
              key={idx}
              className="doctor-card"
              onClick={() => selectDoctor(doc)}
              style={{ marginBottom: '8px' }}
            >
              <div className="doctor-avatar">👨‍⚕️</div>
              <div className="doctor-info">
                <div className="doctor-name">{doc.name}</div>
                <div className="doctor-meta">{doc.hospital} • {doc.specialty}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden wallet address field - shown only if search fails */}
      {!formData.walletAddress && (
        <details style={{ marginBottom: '14px' }}>
          <summary style={{ color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer' }}>
            Can't find doctor? Enter ID code manually
          </summary>
          <Input
            placeholder="Doctor's ID code (0x...)"
            value={formData.walletAddress}
            onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
            disabled={loading}
            style={{ marginTop: '8px' }}
          />
        </details>
      )}

      {formData.walletAddress && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--secondary-soft)',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '0.875rem',
          color: 'var(--secondary)'
        }}>
          ✓ Doctor verified: {formData.doctorName || 'Unknown'}
        </div>
      )}
      
      <select
        value={formData.duration}
        onChange={(e) => setFormData({...formData, duration: e.target.value})}
        style={{ marginBottom: '14px' }}
        disabled={loading}
      >
        <option value="permanent">Permanent access</option>
        <option value="30days">30 days</option>
        <option value="90days">90 days</option>
        <option value="1year">1 year</option>
      </select>
      
      <textarea
        placeholder="Purpose of access (e.g., Cardiology consultation)"
        value={formData.notes}
        onChange={(e) => setFormData({...formData, notes: e.target.value})}
        style={{ minHeight: '100px', marginBottom: '14px' }}
        disabled={loading}
      />
      
      <div className="flex-row" style={{ gap: '12px' }}>
        {!formData.walletAddress && (
          <Button 
            onClick={searchDoctor} 
            loading={searching}
            secondary
            style={{ flex: 1 }}
          >
            Search Doctor
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          primary 
          loading={loading || status === 'granting'} 
          disabled={!formData.walletAddress}
          style={{ flex: formData.walletAddress ? 1 : 2 }}
        >
          {getButtonText()}
        </Button>
      </div>
    </Card>
  )
}