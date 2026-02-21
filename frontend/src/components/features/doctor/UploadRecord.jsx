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
  ayush: 'AYUSH Record (Ayurveda/Yoga/Unani/Siddha/Homeopathy)',
}

export default function UploadRecord() {
  const { account, addLog } = useWeb3()
  const { uploadRecord, loading } = useMedicalRecords()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    type: '',
    patient: '',
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [generatedHash, setGeneratedHash] = useState('')
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, encrypting, uploading, confirming, success, error

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setGeneratedHash('')
      addLog(`Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'info')
    }
  }

  const generateHash = async () => {
    if (!selectedFile) {
      addLog('Please select a file first', 'error')
      return
    }

    try {
      // Read file and generate hash using encryption service
      const { encryptionService } = await import('@services/encryption.js')
      const result = await encryptionService.encryptFile(selectedFile)
      setGeneratedHash(`0x${result.hash}`)
      addLog(`Hash generated: ${result.hash.slice(0, 20)}...`, 'info')
    } catch (err) {
      console.error('Hash generation failed:', err)
      addLog('Hash generation failed', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.patient || !selectedFile) {
      addLog('Please fill all required fields and select a file', 'error')
      return
    }

    if (!ethers.isAddress(formData.patient)) {
      addLog('Invalid patient address', 'error')
      return
    }

    if (formData.patient.toLowerCase() === account?.toLowerCase()) {
      addLog('Cannot upload record for yourself as doctor', 'error')
      return
    }

    setUploadStatus('encrypting')
    try {
      const result = await uploadRecord(
        formData.patient,
        selectedFile,
        formData.type,
        formData.description
      )

      if (result && result.success) {
        setUploadStatus('success')
        // Reset form
        setFormData({ type: '', patient: '', description: '' })
        setSelectedFile(null)
        setGeneratedHash('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        
        setTimeout(() => setUploadStatus('idle'), 5000)
      } else {
        setUploadStatus('error')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadStatus('error')
    }
  }

  const getStatusDisplay = () => {
    switch (uploadStatus) {
      case 'encrypting': return { text: '🔐 Encrypting file...', color: 'var(--accent)' }
      case 'uploading': return { text: '📤 Uploading to IPFS...', color: 'var(--primary)' }
      case 'confirming': return { text: '⛓️ Confirming on blockchain...', color: 'var(--secondary)' }
      case 'success': return { text: '✅ Upload complete!', color: 'var(--success)' }
      case 'error': return { text: '❌ Upload failed', color: 'var(--danger)' }
      default: return null
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <Card>
      <div className="section-title">Upload Medical Record</div>
      <div className="info-text">
        Upload patient records to IPFS with blockchain verification. Supports all medical systems including Allopathy and AYUSH.
      </div>

      {statusDisplay && (
        <div style={{
          padding: '16px',
          background: statusDisplay.color + '20',
          color: statusDisplay.color,
          borderRadius: '12px',
          marginBottom: '16px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {statusDisplay.text}
        </div>
      )}

      <select
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
        style={{ marginBottom: '14px' }}
        disabled={loading || uploadStatus !== 'idle'}
      >
        <option value="">Select record type...</option>
        {Object.entries(RECORD_TYPES).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Patient wallet address (0x...)"
        value={formData.patient}
        onChange={(e) => setFormData({...formData, patient: e.target.value})}
        disabled={loading || uploadStatus !== 'idle'}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ marginBottom: '14px' }}
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
          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </div>
      )}

      {generatedHash && (
        <input
          type="text"
          value={generatedHash}
          readOnly
          placeholder="Generated hash will appear here"
          style={{ 
            marginBottom: '14px',
            background: 'var(--secondary-soft)',
            color: 'var(--secondary)'
          }}
        />
      )}

      <textarea
        placeholder="Clinical notes and description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        style={{ minHeight: '100px', marginBottom: '14px' }}
        disabled={loading || uploadStatus !== 'idle'}
      />

      <div className="flex-row">
        <Button 
          onClick={generateHash} 
          disabled={!selectedFile || loading || uploadStatus !== 'idle'}
          style={{ flex: 1 }}
        >
          Generate Hash
        </Button>
        <Button 
          onClick={handleSubmit} 
          primary 
          loading={loading || uploadStatus !== 'idle' && uploadStatus !== 'success' && uploadStatus !== 'error'}
          disabled={!selectedFile || !formData.patient || !formData.type}
          style={{ flex: 2 }}
        >
          {uploadStatus === 'success' ? 'Uploaded!' : 'Upload to Blockchain'}
        </Button>
      </div>
    </Card>
  )
}