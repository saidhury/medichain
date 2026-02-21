import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import { apiService } from '@services/api.js'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'
import Table from '@components/ui/Table.jsx'
import RecordModal from '../shared/RecordModal.jsx'

const RECORD_TYPE_LABELS = {
  lab: '🧪 Lab Results',
  imaging: '🩻 Imaging',
  prescription: '💊 Prescription',
  discharge: '📋 Discharge Summary',
  referral: '📨 Referral',
  vaccination: '💉 Immunization',
  ayush: '🌿 AYUSH',
  unknown: '📄 Document',
}

export default function RecordsList() {
  const { account, addLog } = useWeb3()
  const { getMyRecords, downloadAndDecrypt, loading } = useMedicalRecords()
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const loadRecords = useCallback(async () => {
    if (!account) {
      console.warn('[RecordsList] No account available')
      return
    }

    setIsLoading(true)
    console.info('[RecordsList] Loading records for:', account)
    addLog('Loading medical records from blockchain...', 'info')

    try {
      const blockchainRecords = await getMyRecords()
      console.info('[RecordsList] Got records from blockchain:', blockchainRecords.length)

      // Transform blockchain data to display format with safe fallbacks
      const transformed = blockchainRecords.map((record, idx) => {
        console.debug(`[RecordsList] Processing record ${idx}:`, record)
        
        // Safe date parsing
        let recordDate = 'Unknown Date'
        try {
          if (record.timestamp) {
            const timestamp = typeof record.timestamp === 'bigint' 
              ? Number(record.timestamp) 
              : Number(record.timestamp)
            recordDate = new Date(timestamp * 1000).toLocaleDateString('en-IN')
          }
        } catch (e) {
          console.warn('[RecordsList] Failed to parse date:', e)
        }

        // Safe address formatting
        let doctorDisplay = 'Unknown Doctor'
        try {
          const doctorAddr = record.uploadedBy || record.uploaded_by || record.doctor
          if (doctorAddr && typeof doctorAddr === 'string') {
            doctorDisplay = `${doctorAddr.slice(0, 6)}...${doctorAddr.slice(-4)}`
          }
        } catch (e) {
          console.warn('[RecordsList] Failed to format doctor:', e)
        }

        // Determine record type from filename or default to unknown
        const filename = record.filename || record.fileName || ''
        let recordType = 'unknown'
        if (filename.toLowerCase().includes('lab') || filename.toLowerCase().includes('blood')) recordType = 'lab'
        else if (filename.toLowerCase().includes('xray') || filename.toLowerCase().includes('mri') || filename.toLowerCase().includes('scan')) recordType = 'imaging'
        else if (filename.toLowerCase().includes('prescription')) recordType = 'prescription'
        else if (filename.toLowerCase().includes('discharge')) recordType = 'discharge'

        // Create unique ID: use blockchain index + CID suffix to ensure uniqueness
        const cidSuffix = (record.ipfsCID || record.ipfs_cid || record.cid || '').slice(-6)
        const uniqueId = `bc-${idx}-${cidSuffix}`

        return {
          id: uniqueId,
          displayId: idx + 1,
          blockchainIndex: idx,
          type: recordType,
          typeLabel: RECORD_TYPE_LABELS[recordType] || RECORD_TYPE_LABELS.unknown,
          title: filename || `Medical Record ${idx + 1}`,
          date: recordDate,
          doctor: doctorDisplay,
          hospital: record.hospital || 'Unknown Hospital',
          cid: record.ipfsCID || record.ipfs_cid || record.cid,
          hash: record.fileHash || record.file_hash || record.hash,
          status: 'verified',
          desc: record.description || record.desc || `Blockchain verified record. Hash: ${(record.fileHash || record.hash || '').slice(0, 20)}...`,
          fileSize: record.file_size || record.fileSize || 0,
          txHash: record.tx_hash || record.txHash,
          inBackend: !!record.id && record.id !== idx, // Flag if enriched from backend
          // Store raw data for sync
          raw: record,
          patient: record.patient || record.patient_id,
          uploadedBy: record.uploadedBy || record.uploaded_by,
          timestamp: record.timestamp,
        }
      })

      console.info('[RecordsList] Transformed records:', transformed)
      setRecords(transformed)
      addLog(`Loaded ${transformed.length} medical records from blockchain`, 'info')
    } catch (err) {
      console.error('[RecordsList] Failed to load records:', err)
      addLog('Failed to load records: ' + err.message, 'error')
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [account, getMyRecords, addLog])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  // Sync missing records to backend
  const syncToBackend = async () => {
    const missingRecords = records.filter(r => !r.inBackend)
    if (missingRecords.length === 0) {
      addLog('All records already synced to backend', 'info')
      return
    }

    setSyncing(true)
    addLog(`Syncing ${missingRecords.length} records to backend...`, 'info')

    for (const record of missingRecords) {
      try {
        // Create minimal record in backend
        const formData = new FormData()
        formData.append('patient_address', account)
        formData.append('ipfs_cid', record.cid)
        formData.append('file_hash', record.hash)
        formData.append('filename', record.title)
        formData.append('file_size', record.fileSize || 0)
        formData.append('record_type', record.type)
        formData.append('description', `Synced from blockchain. Original date: ${record.date}`)
        formData.append('tx_hash', record.txHash || '')
        formData.append('doctor_address', record.uploadedBy || '')
        formData.append('encryption_iv', '') // Unknown for old records
        
        // Create placeholder file (since we don't have original)
        const placeholderBlob = new Blob(['SYNCED_FROM_BLOCKCHAIN'])
        formData.append('encrypted_file', placeholderBlob, `${record.title}.synced`)

        const result = await apiService.syncBlockchainRecord(formData)
        console.info(`[Sync] Record ${record.displayId} synced:`, result)
        addLog(`Synced record ${record.displayId} to backend`, 'info')
      } catch (err) {
        console.error(`[Sync] Failed to sync record ${record.displayId}:`, err)
        addLog(`Failed to sync record ${record.displayId}`, 'warn')
      }
    }

    setSyncing(false)
    loadRecords() // Reload to show synced status
  }

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.type === filter)

  const headers = ['#', 'Type', 'Title', 'Date', 'Hospital', 'Status']

  const handleDownload = async (record) => {
    // For now, just open IPFS link
    const url = `https://gateway.pinata.cloud/ipfs/${record.cid}`
    window.open(url, '_blank')
    addLog(`Opening encrypted file: ${record.cid.slice(0, 20)}...`, 'info')
  }

  // Count backend vs blockchain-only
  const backendCount = records.filter(r => r.inBackend).length
  const blockchainOnlyCount = records.length - backendCount

  return (
    <Card>
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <span>Medical Records ({records.length})</span>
        <div className="flex-row">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 'auto', margin: 0, padding: '8px 36px 8px 16px', fontSize: '0.875rem' }}
          >
            <option value="all">All Records</option>
            <option value="lab">Lab Results</option>
            <option value="imaging">Imaging & X-Rays</option>
            <option value="prescription">Prescriptions</option>
            <option value="discharge">Discharge Summaries</option>
            <option value="vaccination">Immunization Records</option>
            <option value="ayush">AYUSH Records</option>
          </select>
          <Button 
            onClick={loadRecords} 
            loading={isLoading || loading}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="info-text">
        Your complete health history secured on IPFS and verified on the Ethereum blockchain.
        {blockchainOnlyCount > 0 && (
          <span style={{ color: 'var(--warning)', display: 'block', marginTop: '8px' }}>
            ⚠️ {blockchainOnlyCount} record(s) exist only on blockchain. 
            <Button 
              onClick={syncToBackend} 
              loading={syncing}
              style={{ padding: '4px 12px', fontSize: '0.75rem', marginLeft: '8px' }}
            >
              Sync to DB
            </Button>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="empty">Loading records from blockchain...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty">
          {records.length === 0 
            ? 'No records found. Records will appear here when doctors upload them to the blockchain.'
            : 'No records match the selected filter.'
          }
        </div>
      ) : (
        <Table headers={headers}>
          {filteredRecords.map((record, idx) => (
            <tr 
              key={record.id}  // Unique composite key
              onClick={() => setSelectedRecord(record)} 
              style={{ cursor: 'pointer' }}
            >
              <td>{record.displayId}</td>
              <td>{record.typeLabel}</td>
              <td>{record.title}</td>
              <td>{record.date}</td>
              <td>{record.hospital}</td>
              <td>
                <span className="tag" style={{
                  background: record.inBackend ? 'var(--secondary-soft)' : 'var(--accent-soft)',
                  color: record.inBackend ? 'var(--secondary)' : 'var(--accent)',
                  fontSize: '0.75rem'
                }}>
                  {record.inBackend ? '✓ Synced' : '⛓️ Blockchain'}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {selectedRecord && (
        <RecordModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)}
          onDownload={() => handleDownload(selectedRecord)}
        />
      )}
    </Card>
  )
}