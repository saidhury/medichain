import React, { useState, useEffect } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Header from '@components/layout/Header.jsx'
import Navigation from '@components/layout/Navigation.jsx'
import PatientPortal from '@components/features/patient/PatientPortal.jsx'
import DoctorPortal from '@components/features/doctor/DoctorPortal.jsx'
import ActivityLog from '@components/features/shared/ActivityLog.jsx'
import WalletModal from '@components/features/wallet/WalletModal.jsx'
import OnboardingPage from '@components/features/onboarding/OnboardingPage.jsx'

function App() {
  const { isConnected, account, connect } = useWeb3()
  const [activeRole, setActiveRole] = useState('patient')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(null)

  // Check for MetaMask on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const installed = typeof window !== 'undefined' && !!window.ethereum
      setHasMetaMask(installed)
    }
    checkMetaMask()
    // Re-check if ethereum becomes available
    window.addEventListener('ethereum#initialized', checkMetaMask, { once: true })
  }, [])

  // Show onboarding if no MetaMask or not connected
  const showOnboarding = !hasMetaMask || !isConnected

  if (showOnboarding) {
    return (
      <div className="container">
        <OnboardingPage onConnect={connect} />
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