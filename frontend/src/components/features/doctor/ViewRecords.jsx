import React, { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'
import Table from '@components/ui/Table.jsx'
import RecordModal from '../shared/RecordModal.jsx'

const RECORD_TYPE_LABELS = {
  lab: '🧪 Lab Results',
  imaging: '🩻 Imaging',
  prescription: '💊 Prescription',
  discharge: '📋 Discharge',
  referral: '📨 Referral',
  vaccination: '💉 Immunization',
  ayush: '🌿 AYUSH',
  unknown: '📄 Document',
}

export default function ViewRecords() {
  const { account, addLog } = useWeb3()
  const { checkAccess, getPatientRecords, loading } = useMedicalRecords()
  const [patientAddress, setPatientAddress] = useState('')
  const [hasAccess, setHasAccess] = useState(null)
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const handleCheckAccess = async () => {
    if (!ethers.isAddress(patientAddress)) {
      addLog('Invalid patient address', 'error')
      setHasAccess(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await checkAccess(patientAddress, account)
      setHasAccess(result)
      addLog(result ? 'Access verified for this patient' : 'No access to this patient', result ? 'info' : 'warn')
    } catch (err) {
      console.error('Access check failed:', err)
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadRecords = async () => {
    if (!ethers.isAddress(patientAddress)) {
      addLog('Invalid patient address', 'error')
      return
    }

    setIsLoading(true)
    try {
      const patientRecords = await getPatientRecords(patientAddress)
      
      // Transform for display
      const transformed = patientRecords.map((record, idx) => ({
        id: record.id || idx,
        type: record.record_type || 'unknown',
        typeLabel: RECORD_TYPE_LABELS[record.record_type] || RECORD_TYPE_LABELS.unknown,
        title: record.filename || `Record ${idx + 1}`,
        date: new Date(Number(record.timestamp) * 1000).toLocaleDateString('en-IN'),
        doctor: record.uploadedByName || `${record.uploadedBy.slice(0, 6)}...${record.uploadedBy.slice(-4)}`,
        hospital: record.hospital || 'Unknown Hospital',
        cid: record.ipfsCID,
        hash: record.fileHash,
        status: 'verified',
        desc: record.description || 'No description available',
      }))

      setRecords(transformed)
    } catch (err) {
      console.error('Failed to load patient records:', err)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const headers = ['Date', 'Type', 'Title', 'Hospital', 'Action']

  return (
    <Card>
      <div className="section-title">View Patient Records</div>
      <div className="info-text">
        Access complete medical history for patients who have granted you permission.
      </div>

      <input
        type="text"
        placeholder="Patient wallet address (0x...)"
        value={patientAddress}
        onChange={(e) => setPatientAddress(e.target.value)}
        disabled={isLoading || loading}
      />

      <div className="flex-row" style={{ marginBottom: '16px' }}>
        <Button 
          onClick={handleCheckAccess} 
          loading={isLoading}
          disabled={!patientAddress}
          style={{ flex: 1 }}
        >
          Verify Access
        </Button>
        <Button 
          onClick={handleLoadRecords} 
          secondary
          loading={isLoading || loading}
          disabled={!patientAddress}
          style={{ flex: 1 }}
        >
          View Records
        </Button>
      </div>

      {hasAccess !== null && (
        <div style={{ marginBottom: '16px' }}>
          <span className="tag" style={{ 
            background: hasAccess ? 'var(--secondary-soft)' : 'var(--primary-soft)',
            color: hasAccess ? 'var(--secondary)' : 'var(--primary)',
            padding: '12px 20px'
          }}>
            {hasAccess ? '✓ Access verified for this patient' : '✗ No access to this patient'}
          </span>
        </div>
      )}

      {records.length > 0 && (
        <Table headers={headers}>
          {records.map((record, idx) => (
            <tr key={idx}>
              <td>{record.date}</td>
              <td>{record.typeLabel}</td>
              <td>{record.title}</td>
              <td>{record.hospital}</td>
              <td>
                <Button 
                  onClick={() => setSelectedRecord(record)} 
                  secondary 
                  style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {selectedRecord && (
        <RecordModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </Card>
  )
}