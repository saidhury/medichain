import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import MedicalRecordsABI from '../contracts/MedicalRecords.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;

export const useContract = (signer) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  const initContract = useCallback(() => {
    if (!signer) return null;
    
    const contractInstance = new ethers.Contract(
      CONTRACT_ADDRESS,
      MedicalRecordsABI.abi,
      signer
    );
    
    setContract(contractInstance);
    return contractInstance;
  }, [signer]);

  const addRecord = async (patientAddress, cid, hash) => {
    if (!contract) initContract();
    if (!contract) throw new Error('Contract not initialized');

    setLoading(true);
    try {
      // Convert hash string to bytes32 if needed
      const hashBytes = hash.startsWith('0x') ? hash : ethers.keccak256(ethers.toUtf8Bytes(hash));
      
      const tx = await contract.addRecord(patientAddress, cid, hashBytes);
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

  const grantAccess = async (doctorAddress) => {
    if (!contract) initContract();
    
    setLoading(true);
    try {
      const tx = await contract.grantAccess(doctorAddress);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (doctorAddress) => {
    if (!contract) initContract();
    
    setLoading(true);
    try {
      const tx = await contract.revokeAccess(doctorAddress);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = async (patientAddress, doctorAddress) => {
    if (!contract) initContract();
    
    try {
      return await contract.hasAccess(patientAddress, doctorAddress);
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  };

  const getRecords = async (patientAddress) => {
    if (!contract) initContract();
    
    try {
      const records = await contract.getRecords(patientAddress);
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
    if (!contract) initContract();
    
    try {
      const records = await contract.getMyRecords();
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

  return {
    contract,
    loading,
    addRecord,
    grantAccess,
    revokeAccess,
    hasAccess,
    getRecords,
    getMyRecords,
    initContract
  };
};