import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Shield, FileText, Users, Lock } from 'lucide-react';

const Landing = ({ onConnect, isConnecting, showRoleSelect = false }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const { switchRole } = useWallet();

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    await onConnect(role);
  };

  return (
    <div className="landing">
      <div className="hero" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Blockchain Medical Records
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Secure, tamper-proof, and patient-controlled medical record management 
          powered by Ethereum and IPFS.
        </p>
        
        <div className="features grid grid-3" style={{ marginTop: '3rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <Shield size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
            <h3>Tamper-Proof</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Cryptographic verification ensures data integrity
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <Lock size={48} style={{ color: 'var(--accent-success)', marginBottom: '1rem' }} />
            <h3>Patient Controlled</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              You decide who can access your medical records
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }} />
            <h3>Decentralized</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Stored on IPFS with blockchain-verified hashes
            </p>
          </div>
        </div>
      </div>

      {showRoleSelect && (
        <div className="role-selection" style={{ marginTop: '3rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Select Your Role</h2>
          <div className="role-selector">
            <div 
              className={`role-card ${selectedRole === 'patient' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('patient')}
            >
              <Users size={48} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
              <h3>Patient</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                View your records and manage doctor access
              </p>
            </div>
            <div 
              className={`role-card ${selectedRole === 'doctor' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('doctor')}
            >
              <FileText size={48} style={{ marginBottom: '1rem', color: 'var(--accent-success)' }} />
              <h3>Doctor</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Upload records and access patient data
              </p>
            </div>
          </div>
        </div>
      )}

      {!showRoleSelect && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onConnect()}
            disabled={isConnecting}
            style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
          >
            {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Landing;