import React, { useState } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Button from '@components/ui/Button.jsx'
import ProfileModal from '@components/features/profile/ProfileModal.jsx'

export default function Header({ onWalletClick }) {
  const { userProfile, isConnected, disconnect } = useWeb3()
  const [showProfile, setShowProfile] = useState(false)

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <div className="header">
        <h1>MediChain</h1>
        <div className="flex-row">
          {!isConnected ? (
            <Button onClick={onWalletClick} primary>
              Sign In
            </Button>
          ) : (
            <div 
              onClick={() => setShowProfile(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                background: 'var(--bg-input)',
                borderRadius: '20px',
                cursor: 'pointer',
                border: '2px solid var(--border)',
                transition: 'all 0.2s ease'
              }}
              className="hover:border-primary"
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {getInitials(userProfile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {userProfile.name || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {userProfile.role}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <ProfileModal 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </>
  )
}