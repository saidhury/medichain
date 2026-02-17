import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [role, setRole] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async (selectedRole = null) => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0].toLowerCase();
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setAccount(address);
      setProvider(provider);
      setSigner(signer);

      // Check if user exists in backend
      try {
        const response = await axios.get(`${API_URL}/api/users/${address}/`);
        setRole(response.data.role);
      } catch (error) {
        // User not found, register if role selected
        if (selectedRole) {
          const registerRes = await axios.post(`${API_URL}/api/users/register/`, {
            wallet_address: address,
            role: selectedRole
          });
          setRole(registerRes.data.user.role);
        } else {
          setRole(null); // Will show role selection
        }
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0].toLowerCase());
    }
  };

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setRole(null);
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, []);

  const switchRole = async (newRole) => {
    if (!account) return;
    
    try {
      await axios.post(`${API_URL}/api/users/register/`, {
        wallet_address: account,
        role: newRole
      });
      setRole(newRole);
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  return {
    account,
    provider,
    signer,
    role,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchRole
  };
};