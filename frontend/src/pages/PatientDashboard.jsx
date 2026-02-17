import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import axios from 'axios';
import { Shield, ShieldOff, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PatientDashboard = ({ account }) => {
  const { signer } = useWallet();
  const { getMyRecords, grantAccess, revokeAccess, hasAccess, loading } = useContract(signer);
  
  const [records, setRecords] = useState([]);
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [activeTab, setActiveTab] = useState('records');

  useEffect(() => {
    fetchRecords();
  }, [account]);

  const fetchRecords = async () => {
    try {
      const myRecords = await getMyRecords();
      setRecords(myRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!doctorAddress || !doctorAddress.startsWith('0x')) {
      alert('Please enter a valid doctor address');
      return;
    }
    
    try {
      await grantAccess(doctorAddress.toLowerCase());
      alert('Access granted successfully!');
      setDoctorAddress('');
      fetchRecords();
    } catch (error) {
      alert('Error granting access: ' + error.message);
    }
  };

  const handleRevokeAccess = async (doctorAddr) => {
    try {
      await revokeAccess(doctorAddr);
      alert('Access revoked successfully!');
      fetchRecords();
    } catch (error) {
      alert('Error revoking access: ' + error.message);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateHash = (hash) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="patient-dashboard">
      <h1 style={{ marginBottom: '2rem' }}>Patient Dashboard</h1>
      
      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${activeTab === 'records' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('records')}
          style={{ background: activeTab === 'records' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <FileText size={16} style={{ marginRight: '0.5rem' }} />
          My Records
        </button>
        <button 
          className={`btn ${activeTab === 'access' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('access')}
          style={{ background: activeTab === 'access' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <Shield size={16} style={{ marginRight: '0.5rem' }} />
          Access Control
        </button>
      </div>

      {activeTab === 'records' && (
        <div className="records-section">
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Medical Records</h2>
            {records.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No medical records found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>IPFS CID</th>
                    <th>File Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.timestamp)}</td>
                      <td>{truncateHash(record.uploadedBy)}</td>
                      <td>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          {record.ipfsCID.slice(0, 15)}...
                        </a>
                      </td>
                      <td title={record.fileHash}>{truncateHash(record.fileHash)}</td>
                      <td>
                        <span className="badge badge-verified">
                          <CheckCircle size={12} style={{ marginRight: '4px' }} />
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="access-section">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Grant Access to Doctor</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter doctor's wallet address (0x...)"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-success" 
                onClick={handleGrantAccess}
                disabled={loading}
              >
                <Shield size={16} style={{ marginRight: '0.5rem' }} />
                Grant Access
              </button>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Authorized Doctors</h2>
            {authorizedDoctors.length === 0 ? (
              <div className="empty-state">
                <ShieldOff size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No doctors currently have access</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Doctor Address</th>
                    <th>Granted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authorizedDoctors.map((doctor) => (
                    <tr key={doctor.address}>
                      <td>{doctor.address}</td>
                      <td>{doctor.grantedDate}</td>
                      <td>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleRevokeAccess(doctor.address)}
                          disabled={loading}
                        >
                          <ShieldOff size={16} style={{ marginRight: '0.5rem' }} />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;