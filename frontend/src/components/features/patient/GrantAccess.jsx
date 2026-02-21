import React, { useState } from 'react'
import { ethers } from 'ethers'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'
import Input from '@components/ui/Input.jsx'
import Button from '@components/ui/Button.jsx'

export default function GrantAccess({ onGrant }) {
  const { account, addLog } = useWeb3()
  const { grantAccess, loading, error } = useMedicalRecords()
  const [formData, setFormData] = useState({
    name: '',
    hospital: '',
    address: '',
    duration: 'permanent',
    notes: ''
  })
  const [status, setStatus] = useState('idle') // idle, checking, granting, success, error

  const validateAddress = (addr) => {
    if (!ethers.isAddress(addr)) {
      addLog('Invalid Ethereum address format', 'error')
      return false
    }
    if (addr.toLowerCase() === account?.toLowerCase()) {
      addLog('Cannot grant access to yourself', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      addLog('Please fill in required fields (name and address)', 'error')
      return
    }

    if (!validateAddress(formData.address)) return

    setStatus('checking')
    try {
      // Check if doctor exists in backend
      let doctorExists = false
      try {
        const doctorData = await apiService.getUser(formData.address)
        if (doctorData.role === 'doctor') {
          doctorExists = true
          console.info('[GrantAccess] Doctor verified in backend:', doctorData)
        }
      } catch (err) {
        console.warn('[GrantAccess] Doctor not found in backend, proceeding anyway')
      }

      setStatus('granting')
      const success = await grantAccess(formData.address)
      
      if (success) {
        setStatus('success')
        // Clear form
        setFormData({ name: '', hospital: '', address: '', duration: 'permanent', notes: '' })
        onGrant?.()
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('[GrantAccess] Error:', err)
      setStatus('error')
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'checking': return 'Verifying Doctor...'
      case 'granting': return 'Granting Access...'
      case 'success': return '✓ Access Granted!'
      case 'error': return 'Failed - Try Again'
      default: return 'Grant Access'
    }
  }

  return (
    <Card>
      <div className="section-title">Grant Access to Doctor</div>
      <div className="info-text">
        Enter your doctor's details to securely share your medical records. 
        You control the duration and can revoke access anytime.
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
          Error: {error}
        </div>
      )}

      <Input
        placeholder="Doctor's full name (e.g., Dr. Shivam Kumar)"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        disabled={loading}
      />
      
      <Input
        placeholder="Hospital/Clinic name"
        value={formData.hospital}
        onChange={(e) => setFormData({...formData, hospital: e.target.value})}
        disabled={loading}
      />
      
      <Input
        placeholder="Doctor's wallet address (0x...)"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
        disabled={loading}
      />
      
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
      
      <Button 
        onClick={handleSubmit} 
        primary 
        loading={loading || status === 'checking' || status === 'granting'} 
        fullWidth
        style={status === 'success' ? { background: 'var(--success)' } : {}}
      >
        {getButtonText()}
      </Button>
    </Card>
  )
}