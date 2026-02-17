import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import MedicalRecordsABI from '../contracts/MedicalRecords.json';

// Hardcoded fallback for testing - REPLACE WITH YOUR ACTUAL ADDRESS
const CONTRACT_ADDRESS = "0x369dB59e598Af7e37f5Ef5879b2eA0144904C7AE";

// Validate address
const isValidAddress = (addr) => {
  return addr && addr.startsWith('0x') && addr.length === 42;
};

export const useContract = (signer) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initContract = useCallback(() => {
    if (!signer) {
      console.log('No signer available');
      return null;
    }
    
    if (!isValidAddress(CONTRACT_ADDRESS)) {
      const err = `Invalid or missing contract address: "${CONTRACT_ADDRESS}". Please set VITE_CONTRACT_ADDRESS in .env file`;
      console.error(err);
      setError(err);
      return null;
    }
    
    if (contract) {
      return contract;
    }
    
    try {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        MedicalRecordsABI.abi,
        signer
      );
      
      setContract(contractInstance);
      setError(null);
      console.log('Contract initialized at:', CONTRACT_ADDRESS);
      return contractInstance;
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      setError(error.message);
      return null;
    }
  }, [signer, contract]);

  const ensureContract = () => {
    if (!isValidAddress(CONTRACT_ADDRESS)) {
      throw new Error('Contract address not configured. Check your .env file');
    }
    if (!contract) {
      return initContract();
    }
    return contract;
  };

  const grantAccess = async (doctorAddress) => {
    const c = ensureContract();
    if (!c) throw new Error('Contract not initialized');

    setLoading(true);
    setError(null);
    
    try {
      console.log('Granting access to:', doctorAddress);
      console.log('From account:', await c.runner.getAddress());
      
      const tx = await c.grantAccess(doctorAddress);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error('Error granting access:', error);
      setError(error.reason || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (doctorAddress) => {
    const c = ensureContract();
    if (!c) throw new Error('Contract not initialized');

    setLoading(true);
    setError(null);
    
    try {
      const tx = await c.revokeAccess(doctorAddress);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error('Error revoking access:', error);
      setError(error.reason || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = async (patientAddress, doctorAddress) => {
    const c = ensureContract();
    if (!c) return false;

    try {
      return await c.hasAccess(patientAddress, doctorAddress);
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  };

  const getRecords = async (patientAddress) => {
    const c = ensureContract();
    if (!c) return [];

    try {
      const records = await c.getRecords(patientAddress);
      return records.map((r, index) => ({
        id: index,
        ipfsCID: r.ipfsCID,
        fileHash: r.fileHash,
        patient: r.patient,
        uploadedBy: r.uploadedBy,
        timestamp: Number(r.timestamp),
        exists: r.exists
      }));
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    }
  };

  const getMyRecords = async () => {
    const c = ensureContract();
    if (!c) return [];

    try {
      const records = await c.getMyRecords();
      return records.map((r, index) => ({
        id: index,
        ipfsCID: r.ipfsCID,
        fileHash: r.fileHash,
        patient: r.patient,
        uploadedBy: r.uploadedBy,
        timestamp: Number(r.timestamp),
        exists: r.exists
      }));
    } catch (error) {
      console.error('Error fetching my records:', error);
      throw error;
    }
  };

  const getAuthorizedDoctors = async (patientAddress) => {
    const c = ensureContract();
    if (!c) return [];

    try {
      const doctors = await c.getAuthorizedDoctors(patientAddress);
      return doctors;
    } catch (error) {
      console.error('Error fetching authorized doctors:', error);
      return [];
    }
  };

  const addRecord = async (patientAddress, cid, hash) => {
    const c = ensureContract();
    if (!c) throw new Error('Contract not initialized');

    setLoading(true);
    try {
      const hashBytes = hash.startsWith('0x') ? hash : ethers.keccak256(ethers.toUtf8Bytes(hash));
      
      const tx = await c.addRecord(patientAddress, cid, hashBytes);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    contract,
    loading,
    error,
    grantAccess,
    revokeAccess,
    hasAccess,
    getRecords,
    getMyRecords,
    getAuthorizedDoctors,
    addRecord,
    initContract,
    contractAddress: CONTRACT_ADDRESS,
    isConfigured: isValidAddress(CONTRACT_ADDRESS)
  };
};