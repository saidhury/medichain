import React, { useState } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMedicalRecords } from '@hooks/useMedicalRecords.js'
import { ipfsService } from '@services/ipfs.js'
import Modal from '@components/ui/Modal.jsx'
import Button from '@components/ui/Button.jsx'

export default function RecordModal({ record, onClose, onDownload }) {
  const { addLog } = useWeb3()
  const { downloadAndDecrypt, loading } = useMedicalRecords()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (onDownload) {
        await onDownload()
      } else {
        // Fallback: direct IPFS download (encrypted)
        const url = ipfsService.getGatewayUrl(record.cid)
        window.open(url, '_blank')
        addLog(`Opened encrypted file from IPFS: ${record.cid.slice(0, 20)}...`, 'info')
      }
    } catch (err) {
      console.error('Download failed:', err)
      addLog('Download failed', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = () => {
    addLog(`Sharing ${record.title}...`, 'info')
    // Would open share dialog
  }

  const handleVerify = () => {
    if (record.txHash) {
      window.open(`https://sepolia.etherscan.io/tx/${record.txHash}`, '_blank')
    } else {
      addLog('No transaction hash available for verification', 'warn')
    }
  }

  const formatHash = (hash) => {
    if (!hash) return '-'
    if (hash.length <= 20) return hash
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Record Details">
      <div className="record-header">
        <span className="record-type">{record.typeLabel || '📄 Document'}</span>
        <span className="tag">{record.status === 'verified' ? '✓ Verified' : 'Pending'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-label">Record ID</span>
        <span className="detail-value">#{record.id}</span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">Date Uploaded</span>
        <span className="detail-value">{record.date}</span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">Uploaded By</span>
        <span className="detail-value">{record.doctor}</span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">Hospital/Clinic</span>
        <span className="detail-value">{record.hospital}</span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">IPFS Content ID (CID)</span>
        <span className="detail-value" style={{ fontSize: '0.75rem' }}>{record.cid}</span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">Blockchain Hash</span>
        <span className="detail-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {formatHash(record.hash)}
        </span>
      </div>
      
      <div className="detail-row">
        <span className="detail-label">File Size</span>
        <span className="detail-value">
          {record.fileSize ? `${(record.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}
        </span>
      </div>

      {record.txHash && (
        <div className="detail-row">
          <span className="detail-label">Transaction</span>
          <span className="detail-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
            {formatHash(record.txHash)}
          </span>
        </div>
      )}
      
      <div className="detail-row" style={{ flexDirection: 'column', gap: '8px' }}>
        <span className="detail-label">Clinical Notes</span>
        <span style={{ 
          padding: '12px', 
          background: 'var(--bg-input)', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          {record.desc}
        </span>
      </div>

      <div className="quick-actions">
        <Button 
          onClick={handleDownload} 
          secondary
          loading={downloading || loading}
        >
          {downloading ? 'Downloading...' : 'Download from IPFS'}
        </Button>
        <Button onClick={handleShare} primary>
          Share with Doctor
        </Button>
        <Button onClick={handleVerify} ghost>
          Verify on Etherscan
        </Button>
      </div>
    </Modal>
  )
}