import React, { useState } from 'react'
import { MOCK_RECORDS, MOCK_DOCTORS } from '@lib/constants.js'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Card from '@components/ui/Card.jsx'
import Button from '@components/ui/Button.jsx'

export default function ShareRecords() {
  const { addLog } = useWeb3()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedRecords, setSelectedRecords] = useState(new Set())

  const filteredRecords = MOCK_RECORDS.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.hospital.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleRecord = (id) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecords(newSelected)
  }

  const handleShare = () => {
    if (selectedRecords.size === 0) {
      addLog('Please select records to share', 'warn')
      return
    }
    if (!selectedDoctor) {
      addLog('Please select a doctor', 'warn')
      return
    }
    
    addLog(`Sharing ${selectedRecords.size} record(s) with doctor via IPFS...`, 'info')
    setSelectedRecords(new Set())
  }

  return (
    <Card>
      <div className="section-title">Share Specific Records</div>
      <div className="info-text">
        Select individual records to share with specific doctors without granting full access.
      </div>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search records by type or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {filteredRecords.length === 0 ? (
          <div className="empty">No records available to share</div>
        ) : (
          filteredRecords.map(record => (
            <div 
              key={record.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                marginBottom: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <input
                type="checkbox"
                checked={selectedRecords.has(record.id)}
                onChange={() => toggleRecord(record.id)}
                style={{ width: 'auto', margin: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{record.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {record.date} • {record.hospital}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-row" style={{ marginTop: '16px' }}>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          style={{ flex: 2, margin: 0 }}
        >
          <option value="">Select doctor...</option>
          {MOCK_DOCTORS.map(doc => (
            <option key={doc.address} value={doc.address}>
              {doc.name}
            </option>
          ))}
        </select>
        <Button onClick={handleShare} primary style={{ flex: 1 }}>
          Share Selected
        </Button>
      </div>
    </Card>
  )
}