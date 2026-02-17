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
      <div className="hero">
        <h1>Blockchain Medical Records</h1>
        <p>Secure, tamper-proof, and patient-controlled medical record management powered by Ethereum and IPFS.</p>
        
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon blue">
              <Shield size={32} />
            </div>
            <h3>Tamper-Proof</h3>
            <p>Cryptographic verification ensures data integrity</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">
              <Lock size={32} />
            </div>
            <h3>Patient Controlled</h3>
            <p>You decide who can access your medical records</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange">
              <FileText size={32} />
            </div>
            <h3>Decentralized</h3>
            <p>Stored on IPFS with blockchain-verified hashes</p>
          </div>
        </div>
      </div>

      {showRoleSelect && (
        <div className="role-selection">
          <h2>Select Your Role</h2>
          <div className="role-grid">
            <div 
              className={`role-card ${selectedRole === 'patient' ? 'selected-patient' : ''}`}
              onClick={() => handleRoleSelect('patient')}
            >
              <div className="role-icon">
                <Users size={40} />
              </div>
              <h3>Patient</h3>
              <p>View your records and manage doctor access</p>
            </div>
            <div 
              className={`role-card ${selectedRole === 'doctor' ? 'selected-doctor' : ''}`}
              onClick={() => handleRoleSelect('doctor')}
            >
              <div className="role-icon">
                <FileText size={40} />
              </div>
              <h3>Doctor</h3>
              <p>Upload records and access patient data</p>
            </div>
          </div>
        </div>
      )}

      {!showRoleSelect && (
        <button 
          className="btn btn-primary" 
          onClick={() => onConnect()}
          disabled={isConnecting}
          style={{ marginTop: '3rem', fontSize: '1.125rem', padding: '1rem 2rem' }}
        >
          {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
        </button>
      )}
    </div>
  );
};

export default Landing;