import React from 'react'
import { useMetaMask } from '@hooks/useMetaMask.js'
import Button from '@components/ui/Button.jsx'

export default function WalletConnect() {
  const { connect, isConnected } = useMetaMask()

  if (isConnected) return null

  return (
    <div className="section" style={{ textAlign: 'center', padding: '64px 32px' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
        Welcome to MediChain
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Connect your MetaMask wallet to securely manage medical records on the blockchain.
      </p>
      <Button onClick={connect} primary>
        Connect MetaMask
      </Button>
    </div>
  )
}