import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [role, setRole] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  
  const listenersSetup = useRef(false);

  // Setup MetaMask listeners
  useEffect(() => {
    if (window.ethereum && !listenersSetup.current) {
      listenersSetup.current = true;
      
      const handleAccountsChanged = (accounts) => {
        console.log('MetaMask accounts changed:', accounts);
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else {
          // Account switched - update state
          const newAddress = accounts[0].toLowerCase();
          setAccount(newAddress);
          // Re-fetch role for new account
          fetchUserRole(newAddress);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0].toLowerCase());
            setIsMetaMaskConnected(true);
            fetchUserRole(accounts[0].toLowerCase());
            
            // Setup provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            provider.getSigner().then(signer => setSigner(signer));
          }
        });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const fetchUserRole = async (address) => {
    try {
      const response = await api.get(`/users/${address}/`);
      setRole(response.data.role);
    } catch (error) {
      // User not registered yet
      setRole(null);
    }
  };

  const connectWallet = useCallback(async (selectedRole) => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // This will prompt user to connect if not already
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0].toLowerCase();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setAccount(address);
      setProvider(provider);
      setSigner(signer);
      setIsMetaMaskConnected(true);

      // Register or fetch user
      try {
        const response = await api.get(`/users/${address}/`);
        setRole(response.data.role);
      } catch (error) {
        if (selectedRole) {
          const registerRes = await api.post(`/users/register/`, {
            wallet_address: address,
            role: selectedRole
          });
          setRole(registerRes.data.user.role);
        }
      }

    } catch (error) {
      console.error('Error connecting:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setRole(null);
    setIsMetaMaskConnected(false);
    setError(null);
  }, []);

  const switchRole = useCallback(async (newRole) => {
    if (!account) return;
    
    try {
      await api.post(`/users/register/`, {
        wallet_address: account,
        role: newRole
      });
      setRole(newRole);
    } catch (error) {
      console.error('Error switching role:', error);
    }
  }, [account]);

  return {
    account,
    provider,
    signer,
    role,
    isConnecting,
    isMetaMaskConnected,
    error,
    connectWallet,
    disconnectWallet,
    switchRole
  };
};