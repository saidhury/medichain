import React from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Button from '@components/ui/Button.jsx'

export default function ActivityLog() {
  const { logs, addLog } = useWeb3()

  const clearLog = () => {
    // Reload page to clear logs (simplest approach)
    window.location.reload()
  }

  const exportLogs = () => {
    const logText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medichain-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addLog('Logs exported', 'info')
  }

  const getLogClass = (type) => {
    switch (type) {
      case 'error': return 'error'
      case 'warn': return 'warn'
      case 'info': return 'info'
      default: return ''
    }
  }

  return (
    <div className="section" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <h3 style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.9375rem', 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}>
          Blockchain Activity Log ({logs.length} entries)
        </h3>
        <div className="flex-row">
          <Button onClick={exportLogs} style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Export
          </Button>
          <Button onClick={clearLog} style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Clear
          </Button>
        </div>
      </div>
      
      <div id="log">
        {logs.length === 0 ? (
          <div className="info">MediChain ready. Connect your MetaMask wallet to begin.</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={getLogClass(log.type)}>
              [{log.time}] {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}