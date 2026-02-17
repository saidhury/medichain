import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import axios from 'axios';
import { Upload, Search, CheckCircle, FileText, Download, ExternalLink, Shield, AlertTriangle } from 'lucide-react';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

const ENCRYPTION_API = 'http://localhost:8001';

const DoctorDashboard = ({ account, isManualLogin }) => {
  const { signer } = useWallet();
  const { addRecord, getRecords, hasAccess, loading: contractLoading } = useContract(signer);
  
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientAddress, setPatientAddress] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [patientRecords, setPatientRecords] = useState([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [hasPatientAccess, setHasPatientAccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState({});

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (isManualLogin) {
      alert('File upload requires MetaMask connection. Please login with MetaMask to use this feature.');
      return;
    }

    if (!selectedFile || !patientAddress) {
      alert('Please select a file and enter patient address');
      return;
    }

    if (!patientAddress.startsWith('0x') || patientAddress.length !== 42) {
      alert('Please enter a valid Ethereum address (0x...)');
      return;
    }

    setUploadProgress('Encrypting file...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const encryptRes = await axios.post(`${ENCRYPTION_API}/encrypt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { encrypted_content, iv, key, hash } = encryptRes.data;
      setUploadProgress('Uploading to IPFS...');

      const encryptedBlob = new Blob([Buffer.from(encrypted_content, 'base64')]);
      const ipfsFormData = new FormData();
      ipfsFormData.append('encrypted_file', encryptedBlob, selectedFile.name + '.enc');
      ipfsFormData.append('patient_address', patientAddress);
      ipfsFormData.append('iv', iv);
      ipfsFormData.append('file_hash', hash);
      ipfsFormData.append('filename', selectedFile.name);

      const uploadRes = await api.post(`/records/upload/`, ipfsFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Wallet-Address': account
        }
      });

      const { ipfs_cid, record_id } = uploadRes.data;
      setUploadProgress('Recording on blockchain...');

      const blockchainRes = await addRecord(
        patientAddress.toLowerCase(),
        ipfs_cid,
        hash
      );

      await api.post(`/records/${record_id}/tx/`, {
        tx_hash: blockchainRes.txHash
      });

      setUploadProgress('Complete! ✓');
      setTimeout(() => {
        setUploadProgress('');
        setSelectedFile(null);
        setPatientAddress('');
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const searchPatientRecords = async () => {
    if (isManualLogin) {
      alert('Viewing patient records requires MetaMask connection. Please login with MetaMask to use this feature.');
      return;
    }

    if (!searchAddress || !searchAddress.startsWith('0x')) {
      alert('Please enter a valid patient address');
      return;
    }
    
    try {
      const access = await hasAccess(searchAddress.toLowerCase(), account);
      setHasPatientAccess(access);
      
      if (access) {
        const records = await getRecords(searchAddress.toLowerCase());
        // Enrich with backend data
        const enrichedRecords = await Promise.all(
          records.map(async (record) => {
            try {
              const res = await api.get(`/records/cid/${record.ipfsCID}/`);
              return { ...record, txHash: res.data.tx_hash, recordId: res.data.record_id };
            } catch {
              return record;
            }
          })
        );
        setPatientRecords(enrichedRecords);
      } else {
        setPatientRecords([]);
        alert('You do not have access to this patient\'s records. Ask the patient to grant you access first.');
      }
    } catch (error) {
      console.error('Error searching records:', error);
      alert('Error fetching records: ' + error.message);
    }
  };

  const verifyRecord = async (record) => {
    setVerifying(record.ipfsCID);
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`);
      if (!response.ok) throw new Error('Failed to fetch from IPFS');
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Content = btoa(binary);
      
      const verifyRes = await axios.post(`${ENCRYPTION_API}/verify`, {
        file_content_base64: base64Content,
        expected_hash: record.fileHash
      });

      setVerificationResults({
        ...verificationResults,
        [record.ipfsCID]: {
          verified: verifyRes.data.verified,
          tampered: verifyRes.data.tampered,
          message: verifyRes.data.message
        }
      });

      if (verifyRes.data.tampered) {
        alert('⚠️ WARNING: This file has been tampered with!');
      } else {
        alert('✅ File verified successfully. Integrity confirmed.');
      }
    } catch (error) {
      alert('Error verifying file: ' + error.message);
    } finally {
      setVerifying(null);
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
    if (!txHash) return '#';
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
              Blockchain features are disabled. Connect with MetaMask for full functionality.
            </p>
          </div>
        </div>
      )}
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <div className="wallet-display">
          <FileText size={16} />
          {account}
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          Upload Record
        </button>
        <button 
          className={`tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FileText size={18} />
          View Records
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="card">
          <h2 className="card-title">
            <Upload size={24} />
            Upload Medical Record
          </h2>
          
          <div className="form-group">
            <label className="form-label">Patient Wallet Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              You must have been granted access by this patient to upload records
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Medical Record File</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-input"
                className="file-input"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-input" className="file-input-label">
                <Upload size={24} />
                {selectedFile ? selectedFile.name : 'Click to select file or drag and drop'}
              </label>
            </div>
            {selectedFile && (
              <div className="file-selected">
                <CheckCircle size={16} />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB) - Ready to upload
              </div>
            )}
          </div>

          {uploadProgress && (
            <>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: uploadProgress.includes('Complete') ? '100%' : 
                           uploadProgress.includes('blockchain') ? '75%' :
                           uploadProgress.includes('IPFS') ? '50%' : '25%'
                  }}
                ></div>
              </div>
              <div className="progress-text">
                {!uploadProgress.includes('Complete') && (
                  <div className="spin" style={{ width: 16, height: 16, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                )}
                {uploadProgress.includes('Complete') && <CheckCircle size={16} color="var(--success)" />}
                {uploadProgress}
              </div>
            </>
          )}

          <button 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={!selectedFile || !patientAddress || contractLoading || uploadProgress === 'Complete! ✓'}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <Upload size={18} />
            {contractLoading ? 'Processing...' : uploadProgress === 'Complete! ✓' ? 'Uploaded Successfully' : 'Upload & Encrypt Record'}
          </button>
        </div>
      )}

      {activeTab === 'records' && (
        <>
          <div className="card">
            <h2 className="card-title">
              <Search size={24} />
              Search Patient Records
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Enter a patient's wallet address to view their records (requires access permission)
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter patient address (0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
              <button 
                className="btn btn-primary"
                onClick={searchPatientRecords}
                disabled={!searchAddress}
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>

          {hasPatientAccess && patientRecords.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--success)" />
                Records for {searchAddress.slice(0, 10)}...{searchAddress.slice(-8)}
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>IPFS CID</th>
                      <th>Transaction</th>
                      <th>Verification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientRecords.map((record, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(record.timestamp)}</td>
                        <td className="hash-cell">
                          <a 
                            href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {record.ipfsCID.slice(0, 12)}...
                            <ExternalLink size={12} />
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
                          {verificationResults[record.ipfsCID] ? (
                            <span className={`status ${verificationResults[record.ipfsCID].tampered ? 'status-error' : 'status-success'}`}>
                              {verificationResults[record.ipfsCID].tampered ? (
                                <><AlertTriangle size={14} /> Tampered</>
                              ) : (
                                <><CheckCircle size={14} /> Verified</>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not checked</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                              style={{ padding: '0.5rem' }}
                              title="Download from IPFS"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              className="btn btn-success"
                              onClick={() => verifyRecord(record)}
                              disabled={verifying === record.ipfsCID}
                              style={{ padding: '0.5rem' }}
                              title="Verify integrity"
                            >
                              {verifying === record.ipfsCID ? (
                                <div className="spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                              ) : (
                                <CheckCircle size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasPatientAccess && patientRecords.length === 0 && (
            <div className="empty-state">
              <FileText size={64} className="empty-state-icon" />
              <p>No records found for this patient</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Upload a record using the Upload tab</p>
            </div>
          )}

          {!hasPatientAccess && searchAddress && (
            <div className="empty-state">
              <ShieldOff size={64} className="empty-state-icon" />
              <p>No access to this patient's records</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>The patient must grant you access first</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;