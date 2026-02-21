import React, { useState } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Header from '@components/layout/Header.jsx'
import Navigation from '@components/layout/Navigation.jsx'
import PatientPortal from '@components/features/patient/PatientPortal.jsx'
import DoctorPortal from '@components/features/doctor/DoctorPortal.jsx'
import ActivityLog from '@components/features/shared/ActivityLog.jsx'
import WalletModal from '@components/features/wallet/WalletModal.jsx'

function App() {
  const { isConnected, account } = useWeb3()
  const [activeRole, setActiveRole] = useState('patient')
  const [showWalletModal, setShowWalletModal] = useState(false)

  if (!isConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>MediChain</h1>
          <div className="flex-row">
            <button onClick={() => setShowWalletModal(true)} className="primary">
              Connect Wallet
            </button>
          </div>
        </div>
        <div className="section" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Welcome to MediChain
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Connect your MetaMask wallet to securely manage medical records on the blockchain.
          </p>
        </div>
        {showWalletModal && (
          <WalletModal onClose={() => setShowWalletModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <Header onWalletClick={() => setShowWalletModal(true)} />
      
      <Navigation activeRole={activeRole} onRoleChange={setActiveRole} />
      
      {activeRole === 'patient' ? <PatientPortal /> : <DoctorPortal />}
      
      <ActivityLog />
      
      {showWalletModal && (
        <WalletModal onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  )
}

export default App