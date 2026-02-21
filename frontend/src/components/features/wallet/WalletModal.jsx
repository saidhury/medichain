import React, { useState, useEffect } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import { useMetaMask } from '@hooks/useMetaMask.js'
import Modal from '@components/ui/Modal.jsx'
import Button from '@components/ui/Button.jsx'

export default function WalletModal({ onClose }) {
  const { account, provider, addLog, connect } = useWeb3()
  const { copyAddress, viewOnExplorer, disconnect } = useMetaMask()
  const [balance, setBalance] = useState('0.00')
  const [connectedAt] = useState(new Date())

  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && account) {
        try {
          const bal = await provider.getBalance(account)
          setBalance(parseFloat(bal.toString()) / 1e18)
        } catch (err) {
          console.error('Failed to fetch balance:', err)
        }
      }
    }
    fetchBalance()
  }, [provider, account])

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  const handleConnect = async () => {
    await connect()
    onClose()
  }

  if (!account) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Connect Wallet">
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
            Please connect your MetaMask wallet to use MediChain
          </p>
          <Button onClick={handleConnect} primary fullWidth>
            Connect MetaMask
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Wallet Details">
      <div className="detail-row">
        <span className="detail-label">Wallet Address</span>
        <span className="detail-value">{account}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Network</span>
        <span className="detail-value" style={{ color: 'var(--secondary)' }}>
          Sepolia Testnet (Ethereum)
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">ETH Balance</span>
        <span className="detail-value">{balance.toFixed(4)} ETH</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Transactions</span>
        <span className="detail-value">12</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Connected Since</span>
        <span className="detail-value">{connectedAt.toLocaleString()}</span>
      </div>
      <div className="quick-actions">
        <Button onClick={copyAddress} secondary>
          Copy Address
        </Button>
        <Button onClick={viewOnExplorer} primary>
          View on Etherscan
        </Button>
        <Button onClick={handleDisconnect} danger>
          Disconnect
        </Button>
      </div>
    </Modal>
  )
}