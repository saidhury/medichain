import React, { useState, useEffect, useCallback } from 'react'
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

  const loadRecords = useCallback(async () => {
    if (!account) {
      console.warn('[RecordsList] No account available')
      return
    }

    setIsLoading(true)
    console.info('[RecordsList] Loading records for:', account)
    addLog('Loading medical records...', 'info')

    try {
      const blockchainRecords = await getMyRecords()
      console.info('[RecordsList] Got records from blockchain:', blockchainRecords.length)
      console.debug('[RecordsList] Raw records:', blockchainRecords)

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

        return {
          id: record.id || idx,
          type: recordType,
          typeLabel: RECORD_TYPE_LABELS[recordType] || RECORD_TYPE_LABELS.unknown,
          title: filename || `Medical Record ${idx + 1}`,
          date: recordDate,
          doctor: doctorDisplay,
          hospital: record.hospital || 'Unknown Hospital',
          cid: record.ipfsCID || record.ipfs_cid || record.cid,
          hash: record.fileHash || record.file_hash || record.hash,
          status: 'verified',
          desc: record.description || record.desc || `File hash: ${(record.fileHash || record.hash || '').slice(0, 20)}...`,
          fileSize: record.file_size || record.fileSize || 0,
          txHash: record.tx_hash || record.txHash,
          // Store raw data for download
          raw: record
        }
      })

      console.info('[RecordsList] Transformed records:', transformed)
      setRecords(transformed)
      addLog(`Loaded ${transformed.length} medical records`, 'info')
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

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.type === filter)

  const headers = ['Type', 'Title', 'Date', 'Hospital']

  const handleDownload = async (record) => {
    // For now, just open IPFS link
    // Full decrypt would need the encryption key from secure storage
    const url = `https://gateway.pinata.cloud/ipfs/${record.cid}`
    window.open(url, '_blank')
    addLog(`Opening encrypted file: ${record.cid.slice(0, 20)}...`, 'info')
  }

  // Debug: Log current state
  console.debug('[RecordsList] Render - records:', records.length, 'filtered:', filteredRecords.length)

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
              key={record.id || idx} 
              onClick={() => setSelectedRecord(record)} 
              style={{ cursor: 'pointer' }}
            >
              <td>{record.typeLabel}</td>
              <td>{record.title}</td>
              <td>{record.date}</td>
              <td>{record.hospital}</td>
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