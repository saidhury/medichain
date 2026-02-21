import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, ABI } from '@lib/constants.js'
import { apiService } from '@services/api.js'

const Web3Context = createContext(null)
const SEPOLIA_CHAIN_ID = '0xaa36a7'

// Development logger
const logger = {
  debug: (...args) => console.debug('[Web3Context]', ...args),
  info: (...args) => console.info('[Web3Context]', ...args),
  warn: (...args) => console.warn('[Web3Context]', ...args),
  error: (...args) => console.error('[Web3Context]', ...args),
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState(null)
  const [logs, setLogs] = useState([])
  const [servicesStatus, setServicesStatus] = useState({
    backend: false,
    encryption: false,
    ipfs: false,
  })

  // Use ref to track initialization
  const isInitialized = useRef(false)

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    logger[type] || logger.info(`[${type.toUpperCase()}]`, message)
    setLogs(prev => [...prev, { time: timestamp, message, type }])
  }, [])

  // Check service health on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const checkServices = async () => {
      logger.info('Checking backend service health...')
      const backendOk = await apiService.healthCheck()
      
      // Check encryption service
      const { encryptionService } = await import('@services/encryption.js')
      const encryptionOk = await encryptionService.healthCheck()
      
      // Check IPFS (Pinata)
      const { ipfsService } = await import('@services/ipfs.js')
      const ipfsOk = await ipfsService.testConnection()

      setServicesStatus({ backend: backendOk, encryption: encryptionOk, ipfs: ipfsOk })
      
      logger.info('Service status:', { backend: backendOk, encryption: encryptionOk, ipfs: ipfsOk })
      
      if (!backendOk) addLog('Backend service unavailable', 'warn')
      if (!encryptionOk) addLog('Encryption service unavailable', 'warn')
      if (!ipfsOk) addLog('IPFS (Pinata) unavailable - uploads will fail', 'warn')
    }

    checkServices()
  }, [addLog])

  const switchToSepolia = async () => {
    logger.info('Requesting network switch to Sepolia...')
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      })
      logger.info('Network switch successful')
      return true
    } catch (switchError) {
      if (switchError.code === 4902) {
        logger.info('Sepolia not in wallet, adding network...')
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }],
          })
          return true
        } catch (addError) {
          logger.error('Failed to add Sepolia network:', addError)
          return false
        }
      }
      logger.error('Network switch failed:', switchError)
      return false
    }
  }

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use MediChain')
      return false
    }

    addLog('Connecting wallet...', 'info')
    logger.info('Starting wallet connection...')

    try {
      // Check network
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      logger.info('Current chain ID:', currentChainId)
      
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        addLog('Switching to Sepolia testnet...', 'warn')
        const switched = await switchToSepolia()
        if (!switched) {
          addLog('Failed to switch network', 'error')
          return false
        }
      }

      // Request accounts
      logger.info('Requesting accounts...')
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      logger.info('Accounts received:', accounts.length)

      // Setup ethers
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      const newSigner = await newProvider.getSigner()
      const address = await newSigner.getAddress()
      const { apiService } = await import('@services/api.js')
apiService.setWalletAddress(address)
      const balance = await newProvider.getBalance(address)
      
      logger.info('Connected address:', address)
      logger.info('Balance:', ethers.formatEther(balance), 'ETH')

      // Setup contract
      const newContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, newSigner)
      logger.info('Contract initialized at:', CONTRACT_ADDRESS)

      // Register or get user from backend
      try {
        const userData = await apiService.getUser(address)
        logger.info('Existing user found:', userData.role)
        addLog(`Welcome back, ${userData.role}`, 'info')
      } catch (err) {
        // User doesn't exist, will need to register
        logger.info('New user, registration required')
        addLog('New user - please select your role', 'info')
      }

      setProvider(newProvider)
      setSigner(newSigner)
      setContract(newContract)
      setAccount(address)
      setIsConnected(true)
      setChainId(SEPOLIA_CHAIN_ID)
      
      addLog(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'info')
      
      // Setup event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return true
    } catch (err) {
      logger.error('Connection failed:', err)
      addLog(`Connection failed: ${err.message}`, 'error')
      return false
    }
  }

  const disconnect = useCallback(() => {
    logger.info('Disconnecting wallet...')
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount(null)
    setIsConnected(false)
    setChainId(null)
    addLog('Disconnected', 'info')
    
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [addLog])

  const handleAccountsChanged = useCallback(async (accounts) => {
  logger.info('Accounts changed:', accounts)
  if (accounts.length === 0) {
    const { apiService } = await import('@services/api.js')
    apiService.setWalletAddress('')
    disconnect()
  } else {
    setAccount(accounts[0])
    const { apiService } = await import('@services/api.js')
    apiService.setWalletAddress(accounts[0])
    addLog('Account changed', 'info')
    connect()
  }
}, [disconnect, addLog])

  const handleChainChanged = useCallback(() => {
    logger.info('Chain changed, reloading...')
    window.location.reload()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [handleAccountsChanged, handleChainChanged])

  const value = {
    provider,
    signer,
    contract,
    account,
    isConnected,
    chainId,
    logs,
    servicesStatus,
    addLog,
    connect,
    disconnect,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) throw new Error('useWeb3 must be used within Web3Provider')
  return context
}