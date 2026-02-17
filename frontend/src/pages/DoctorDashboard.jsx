import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import axios from 'axios';
import { Upload, Search, CheckCircle, AlertTriangle, Download, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ENCRYPTION_API = import.meta.env.VITE_ENCRYPTION_API || 'http://localhost:8001';

const DoctorDashboard = ({ account }) => {
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

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientAddress) {
      alert('Please select a file and enter patient address');
      return;
    }

    setUploadProgress('Encrypting file...');
    
    try {
      // Step 1: Encrypt file via FastAPI
      const formData = new FormData();
      formData.append('file', selectedFile);

      const encryptRes = await axios.post(`${ENCRYPTION_API}/encrypt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { encrypted_content, iv, key, hash } = encryptRes.data;
      setUploadProgress('Uploading to IPFS...');

      // Step 2: Create blob from encrypted content and upload to IPFS via Django
      const encryptedBlob = new Blob([Buffer.from(encrypted_content, 'base64')]);
      const ipfsFormData = new FormData();
      ipfsFormData.append('encrypted_file', encryptedBlob, selectedFile.name + '.enc');
      ipfsFormData.append('patient_address', patientAddress);
      ipfsFormData.append('iv', iv);
      ipfsFormData.append('file_hash', hash);
      ipfsFormData.append('filename', selectedFile.name);

      const uploadRes = await axios.post(`${API_URL}/api/records/upload/`, ipfsFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Wallet-Address': account
        }
      });

      const { ipfs_cid, record_id } = uploadRes.data;
      setUploadProgress('Recording on blockchain...');

      // Step 3: Add to blockchain
      const blockchainRes = await addRecord(
        patientAddress.toLowerCase(),
        ipfs_cid,
        hash
      );

      // Step 4: Update transaction hash in backend
      await axios.post(`${API_URL}/api/records/${record_id}/tx/`, {
        tx_hash: blockchainRes.txHash
      });

      setUploadProgress('Complete!');
      alert('Record uploaded successfully!');
      setSelectedFile(null);
      setPatientAddress('');
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const searchPatientRecords = async () => {
    if (!searchAddress) return;
    
    try {
      const access = await hasAccess(searchAddress.toLowerCase(), account);
      setHasPatientAccess(access);
      
      if (access) {
        const records = await getRecords(searchAddress.toLowerCase());
        setPatientRecords(records);
      } else {
        setPatientRecords([]);
        alert('You do not have access to this patient\'s records');
      }
    } catch (error) {
      console.error('Error searching records:', error);
    }
  };

  const verifyRecord = async (record) => {
    setVerifying(true);
    try {
      // Fetch from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Verify via FastAPI
      const verifyRes = await axios.post(`${ENCRYPTION_API}/verify`, {
        file_content_base64: base64Content,
        expected_hash: record.fileHash
      });

      if (verifyRes.data.tampered) {
        alert('⚠️ WARNING: This file has been tampered with!');
      } else {
        alert('✅ File verified successfully. Integrity confirmed.');
      }
    } catch (error) {
      alert('Error verifying file: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="doctor-dashboard">
      <h1 style={{ marginBottom: '2rem' }}>Doctor Dashboard</h1>
      
      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${activeTab === 'upload' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('upload')}
          style={{ background: activeTab === 'upload' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <Upload size={16} style={{ marginRight: '0.5rem' }} />
          Upload Record
        </button>
        <button 
          className={`btn ${activeTab === 'records' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('records')}
          style={{ background: activeTab === 'records' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <FileText size={16} style={{ marginRight: '0.5rem' }} />
          View Records
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="upload-section">
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Upload Medical Record</h2>
            
            <div className="form-group">
              <label className="form-label">Patient Wallet Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Medical Record File</label>
              <input
                type="file"
                className="form-input"
                onChange={handleFileSelect}
                style={{ padding: '0.5rem' }}
              />
              {selectedFile && (
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {uploadProgress && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                {uploadProgress}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              onClick={handleUpload}
              disabled={!selectedFile || !patientAddress || contractLoading}
              style={{ width: '100%' }}
            >
              <Upload size={16} style={{ marginRight: '0.5rem' }} />
              {contractLoading ? 'Processing...' : 'Upload & Encrypt Record'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="records-section">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Search Patient Records</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter patient address (0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary"
                onClick={searchPatientRecords}
              >
                <Search size={16} style={{ marginRight: '0.5rem' }} />
                Search
              </button>
            </div>
          </div>

          {hasPatientAccess && patientRecords.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>
                Records for {searchAddress.slice(0, 10)}...
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>IPFS CID</th>
                    <th>Hash</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patientRecords.map((record, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(record.timestamp)}</td>
                      <td>{record.ipfsCID.slice(0, 15)}...</td>
                      <td>{record.fileHash.slice(0, 10)}...</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '0.5rem' }}
                          >
                            <Download size={16} />
                          </a>
                          <button
                            className="btn btn-success"
                            onClick={() => verifyRecord(record)}
                            disabled={verifying}
                            style={{ padding: '0.5rem' }}
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasPatientAccess && patientRecords.length === 0 && (
            <div className="card empty-state">
              <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No records found for this patient</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;