import React, { useState, useEffect } from 'react';
import { User, Stethoscope, Wallet, AlertCircle, RefreshCw } from 'lucide-react';

const Login = ({ onConnect, isConnecting, error, currentAccount, currentRole }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);

  // Detect MetaMask and current account
  useEffect(() => {
    if (window.ethereum) {
      setMetaMaskAvailable(true);
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setDetectedAddress(accounts[0]);
          }
        });
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setDetectedAddress(accounts[0]);
        } else {
          setDetectedAddress(null);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, []);

  const handleConnect = () => {
    if (selectedRole) {
      onConnect(selectedRole);
    }
  };

  const refreshAccounts = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setDetectedAddress(accounts[0]);
      }
    }
  };

  return (
    <div className="landing">
      <div className="hero">
        <h1>Medical Chain</h1>
        <p>Connect with MetaMask to access your medical records</p>

        {error && (
          <div style={{ 
            margin: '1.5rem auto',
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: 'var(--radius)',
            color: 'var(--danger)',
            maxWidth: '500px'
          }}>
            <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }}/>
            {error}
          </div>
        )}

        {!metaMaskAvailable && (
          <div style={{ 
            margin: '2rem auto',
            padding: '1.5rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            borderRadius: 'var(--radius)',
            color: 'var(--warning)',
            maxWidth: '500px'
          }}>
            <p>MetaMask not detected. Please install MetaMask extension.</p>
          </div>
        )}

        {metaMaskAvailable && (
          <div style={{ 
            margin: '2rem auto', 
            padding: '2rem', 
            background: 'var(--bg-card)', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            maxWidth: '500px'
          }}>
            {/* Show detected account */}
            <div style={{ 
              marginBottom: '2rem',
              padding: '1rem',
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                MetaMask Account Detected
              </p>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '1.1rem',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Wallet size={20} color="var(--primary)" />
                {detectedAddress ? (
                  <>
                    {detectedAddress.slice(0, 6)}...{detectedAddress.slice(-4)}
                    <button 
                      onClick={refreshAccounts}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: 'var(--primary)'
                      }}
                      title="Refresh account"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not connected</span>
                )}
              </div>
              <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {detectedAddress ? 
                  'To use a different account, switch in MetaMask and click refresh' : 
                  'Please unlock MetaMask and click refresh'}
              </p>
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>Select Your Role</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div 
                className={`role-card ${selectedRole === 'patient' ? 'selected-patient' : ''}`}
                style={{ flex: 1, cursor: 'pointer', padding: '1.5rem' }}
                onClick={() => setSelectedRole('patient')}
              >
                <User size={32} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600 }}>Patient</div>
              </div>
              <div 
                className={`role-card ${selectedRole === 'doctor' ? 'selected-doctor' : ''}`}
                style={{ flex: 1, cursor: 'pointer', padding: '1.5rem' }}
                onClick={() => setSelectedRole('doctor')}
              >
                <Stethoscope size={32} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600 }}>Doctor</div>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleConnect}
              disabled={!selectedRole || isConnecting || !detectedAddress}
              style={{ width: '100%' }}
            >
              {isConnecting ? 'Connecting...' : 
               !detectedAddress ? 'Unlock MetaMask First' :
               'Connect & Login'}
            </button>
          </div>
        )}

        <div style={{ 
          marginTop: '2rem',
          padding: '1.5rem', 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius)',
          maxWidth: '600px',
          textAlign: 'left'
        }}>
          <h4>Testing with Multiple Accounts?</h4>
          <ol style={{ color: 'var(--text-muted)', paddingLeft: '1.5rem', lineHeight: '1.8', marginTop: '1rem' }}>
            <li>Open <strong>Tab 1</strong>, select Account 1 in MetaMask, click Refresh, select Patient, Login</li>
            <li>Open <strong>Tab 2</strong>, select Account 2 in MetaMask, click Refresh, select Doctor, Login</li>
            <li>Each tab tracks its own MetaMask account independently</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Login;