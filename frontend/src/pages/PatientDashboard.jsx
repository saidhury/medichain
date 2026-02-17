import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import axios from 'axios';
import { Shield, ShieldOff, FileText, CheckCircle, Users, ExternalLink, Clock, AlertTriangle } from 'lucide-react';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

const PatientDashboard = ({ account }) => {
  const { signer, isManualLogin } = useWallet();
  const { getMyRecords, grantAccess, revokeAccess, getAuthorizedDoctors, loading, initContract } = useContract(signer);
  
  const [records, setRecords] = useState([]);
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [activeTab, setActiveTab] = useState('records');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (signer) {
      initContract();
    }
  }, [signer, initContract]);

  useEffect(() => {
    fetchRecords();
    if (!isManualLogin) {
      fetchAuthorizedDoctors();
    }
  }, [account, isManualLogin]);

  const fetchRecords = async () => {
    try {
      const myRecords = await getMyRecords();
      const enrichedRecords = await Promise.all(
        myRecords.map(async (record) => {
          try {
            const res = await api.get(`/records/cid/${record.ipfsCID}/`);
            return { ...record, txHash: res.data.tx_hash, recordId: res.data.record_id };
          } catch {
            return record;
          }
        })
      );
      setRecords(enrichedRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
      setError('Failed to load records');
    }
  };

  const fetchAuthorizedDoctors = async () => {
    if (!account || !signer) return;
    setIsLoadingDoctors(true);
    try {
      const doctors = await getAuthorizedDoctors(account.toLowerCase());
      const doctorDetails = await Promise.all(
        doctors.map(async (addr) => {
          try {
            const res = await api.get(`/users/${addr}/`);
            return {
              address: addr,
              role: res.data.role,
              grantedDate: new Date().toLocaleDateString()
            };
          } catch {
            return {
              address: addr,
              role: 'doctor',
              grantedDate: 'Unknown'
            };
          }
        })
      );
      setAuthorizedDoctors(doctorDetails);
    } catch (error) {
      console.error('Error fetching authorized doctors:', error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleGrantAccess = async () => {
    if (isManualLogin) {
      alert('Blockchain operations require MetaMask. Please connect with MetaMask to grant access.');
      return;
    }

    if (!signer) {
      alert('Wallet not connected. Please reconnect your wallet.');
      return;
    }

    if (!doctorAddress || !doctorAddress.startsWith('0x') || doctorAddress.length !== 42) {
      alert('Please enter a valid doctor address (0x followed by 40 characters)');
      return;
    }
    
    if (doctorAddress.toLowerCase() === account.toLowerCase()) {
      alert('Cannot grant access to yourself');
      return;
    }
    
    try {
      setError(null);
      await grantAccess(doctorAddress.toLowerCase());
      alert('Access granted successfully!');
      setDoctorAddress('');
      fetchAuthorizedDoctors();
    } catch (error) {
      console.error('Grant access error:', error);
      setError(error.reason || error.message || 'Failed to grant access');
      alert('Error granting access: ' + (error.reason || error.message));
    }
  };

  const handleRevokeAccess = async (doctorAddr) => {
    if (isManualLogin) {
      alert('Blockchain operations require MetaMask. Please connect with MetaMask to revoke access.');
      return;
    }

    if (!signer) {
      alert('Wallet not connected. Please reconnect your wallet.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke access for ${doctorAddr.slice(0, 10)}...?`)) {
      return;
    }
    
    try {
      setError(null);
      await revokeAccess(doctorAddr);
      alert('Access revoked successfully!');
      fetchAuthorizedDoctors();
    } catch (error) {
      console.error('Revoke access error:', error);
      setError(error.reason || error.message || 'Failed to revoke access');
      alert('Error revoking access: ' + (error.reason || error.message));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getEtherscanLink = (txHash) => {
    if (!txHash || txHash === 'N/A') return '#';
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  return (
    <div className="dashboard">
      {isManualLogin && (
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius)',
          color: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Test Mode Active</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Blockchain features (grant/revoke access) are disabled. Connect with MetaMask for full functionality.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)',
          color: 'var(--danger)'
        }}>
          Error: {error}
        </div>
      )}

      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <div className="wallet-display">
          <Users size={16} />
          {account}
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FileText size={18} />
          My Records ({records.length})
        </button>
        <button 
          className={`tab ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          <Shield size={18} />
          Access Control ({authorizedDoctors.length})
        </button>
      </div>

      {activeTab === 'records' && (
        <div className="card">
          <h2 className="card-title">
            <FileText size={24} />
            My Medical Records
          </h2>
          {records.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} className="empty-state-icon" />
              <p>No medical records found</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Your records will appear here when doctors upload them</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>IPFS CID</th>
                    <th>Transaction</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(record.timestamp)}</td>
                      <td className="hash-cell" title={record.uploadedBy}>
                        {truncateHash(record.uploadedBy)}
                      </td>
                      <td>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {record.ipfsCID.slice(0, 12)}...
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td>
                        {record.txHash ? (
                          <a 
                            href={getEtherscanLink(record.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {truncateHash(record.txHash)}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending...</span>
                        )}
                      </td>
                      <td>
                        <span className="status status-success">
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'access' && (
        <>
          <div className="card">
            <h2 className="card-title">
              <Shield size={24} />
              Grant Access to Doctor
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Enter the wallet address of a doctor to allow them to view your records and upload new ones.
            </p>
            <div className="form-group">
              <label className="form-label">Doctor Wallet Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                disabled={isManualLogin || !signer}
              />
              {isManualLogin && (
                <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  ⚠️ Switch to MetaMask login to use this feature
                </p>
              )}
            </div>
            <button 
              className="btn btn-success" 
              onClick={handleGrantAccess}
              disabled={loading || !doctorAddress || isManualLogin || !signer}
            >
              <Shield size={18} />
              {loading ? 'Processing...' : 'Grant Access'}
            </button>
          </div>

          <div className="card">
            <h2 className="card-title">
              <Users size={24} />
              Authorized Doctors
            </h2>
            {isLoadingDoctors ? (
              <div className="empty-state">
                <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}></div>
                <p>Loading doctors...</p>
              </div>
            ) : authorizedDoctors.length === 0 ? (
              <div className="empty-state">
                <ShieldOff size={64} className="empty-state-icon" />
                <p>No doctors currently have access</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Use the form above to grant access</p>
              </div>
            ) : (
              authorizedDoctors.map((doctor, idx) => (
                <div key={idx} className="doctor-item">
                  <div className="doctor-info">
                    <span className="doctor-address" title={doctor.address}>
                      {doctor.address}
                    </span>
                    <span className="doctor-date">
                      <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      Granted: {doctor.grantedDate}
                    </span>
                  </div>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleRevokeAccess(doctor.address)}
                    disabled={loading || isManualLogin || !signer}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <ShieldOff size={16} />
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;