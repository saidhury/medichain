import React, { useState, useRef } from 'react'
import { ethers } from 'ethers'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'

const RECORD_TYPES = {
  lab: 'Lab Results (Pathology)',
  imaging: 'Imaging & Radiology (X-Ray, MRI, CT)',
  prescription: 'Prescription',
  discharge: 'Discharge Summary',
  referral: 'Referral Letter',
  vaccination: 'Immunization Record',
  ayush: 'AYUSH Record',
}

export default function UploadRecord() {
  const { account, userProfile, addLog } = useWeb3()
  const { uploadRecord, loading } = useMedicalRecords()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    type: '',
    patientId: '', // Can be email, phone, or wallet
    patientWallet: '', // Resolved from backend
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [resolving, setResolving] = useState(false)
  const [resolvedPatient, setResolvedPatient] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle')

  const resolvePatient = async () => {
    if (!formData.patientId) {
      addLog('Please enter patient ID', 'error')
      return
    }

    setResolving(true)
    try {
      // Try to resolve by email, phone, or wallet
      const patient = await apiService.resolvePatient(formData.patientId)
      setResolvedPatient(patient)
      setFormData({ ...formData, patientWallet: patient.wallet_address })
      addLog(`Patient found: ${patient.name}`, 'info')
    } catch (err) {
      addLog('Patient not found. Please check the ID or enter wallet address.', 'error')
      setResolvedPatient(null)
    } finally {
      setResolving(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      addLog(`Selected: ${file.name}`, 'info')
    }
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.patientWallet || !selectedFile) {
      addLog('Please fill all required fields', 'error')
      return
    }

    setUploadStatus('encrypting')
    try {
      const result = await uploadRecord(
        formData.patientWallet,
        selectedFile,
        formData.type,
        formData.description
      )

      if (result && result.success) {
        setUploadStatus('success')
        setFormData({ type: '', patientId: '', patientWallet: '', description: '' })
        setSelectedFile(null)
        setResolvedPatient(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        
        setTimeout(() => setUploadStatus('idle'), 5000)
      } else {
        setUploadStatus('error')
      }
    } catch (err) {
      setUploadStatus('error')
    }
  }

  const getStatusDisplay = () => {
    switch (uploadStatus) {
      case 'encrypting': return { text: '🔐 Securing file...', color: 'var(--accent)' }
      case 'uploading': return { text: '📤 Uploading...', color: 'var(--primary)' }
      case 'confirming': return { text: '⛓️ Confirming...', color: 'var(--secondary)' }
      case 'success': return { text: '✅ Upload complete!', color: 'var(--success)' }
      case 'error': return { text: '❌ Upload failed', color: 'var(--danger)' }
      default: return null
    }
  }

  const status = getStatusDisplay()

  return (
    <Card>
      <div className="section-title">Upload Medical Record</div>
      <div className="info-text">
        Upload patient records securely. The file will be encrypted and stored safely.
      </div>

      {status && (
        <div style={{
          padding: '16px',
          background: status.color + '20',
          color: status.color,
          borderRadius: '12px',
          marginBottom: '16px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {status.text}
        </div>
      )}

      <select
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
        disabled={loading || uploadStatus !== 'idle'}
      >
        <option value="">Select record type...</option>
        {Object.entries(RECORD_TYPES).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <div className="flex-row">
        <input
          type="text"
          placeholder="Patient ID (email, phone, or code)"
          value={formData.patientId}
          onChange={(e) => {
            setFormData({...formData, patientId: e.target.value})
            setResolvedPatient(null)
          }}
          disabled={loading || uploadStatus !== 'idle' || resolving}
          style={{ flex: 1 }}
        />
        <Button 
          onClick={resolvePatient} 
          loading={resolving}
          disabled={!formData.patientId || resolvedPatient}
          secondary
        >
          {resolvedPatient ? '✓' : 'Find'}
        </Button>
      </div>

      {resolvedPatient && (
        <div style={{
          padding: '12px',
          background: 'var(--secondary-soft)',
          borderRadius: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ fontWeight: 600 }}>{resolvedPatient.name}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {resolvedPatient.email || resolvedPatient.phone || 'Patient verified'}
          </div>
          {/* Hidden technical details */}
          <details style={{ marginTop: '8px', fontSize: '0.75rem' }}>
            <summary style={{ color: 'var(--text-muted)' }}>Technical Details</summary>
            <code style={{ display: 'block', marginTop: '4px' }}>
              {formData.patientWallet.slice(0, 10)}...{formData.patientWallet.slice(-4)}
            </code>
          </details>
        </div>
      )}

      {/* Fallback for unresolved patients */}
      {!resolvedPatient && (
        <details style={{ marginBottom: '14px' }}>
          <summary style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Can't find patient? Enter wallet address manually
          </summary>
          <input
            type="text"
            placeholder="Patient wallet address (0x...)"
            value={formData.patientWallet}
            onChange={(e) => setFormData({...formData, patientWallet: e.target.value})}
            disabled={loading || uploadStatus !== 'idle'}
            style={{ marginTop: '8px' }}
          />
        </details>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        disabled={loading || uploadStatus !== 'idle'}
      />

      {selectedFile && (
        <div style={{
          padding: '12px',
          background: 'var(--bg-input)',
          borderRadius: '12px',
          marginBottom: '14px',
          fontSize: '0.875rem'
        }}>
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <textarea
        placeholder="Clinical notes and description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        style={{ minHeight: '100px', marginBottom: '14px' }}
        disabled={loading || uploadStatus !== 'idle'}
      />

      <Button 
        onClick={handleSubmit} 
        primary 
        loading={loading || uploadStatus !== 'idle' && uploadStatus !== 'success' && uploadStatus !== 'error'}
        disabled={!selectedFile || !formData.patientWallet || !formData.type}
        fullWidth
      >
        {uploadStatus === 'success' ? 'Uploaded!' : 'Upload & Secure'}
      </Button>
    </Card>
  )
}