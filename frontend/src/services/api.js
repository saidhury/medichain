const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api'

// Get wallet address from localStorage or global state
const getWalletAddress = () => {
  // Try to get from window.ethereum first
  if (window.ethereum?.selectedAddress) {
    return window.ethereum.selectedAddress
  }
  // Fallback to any stored address
  return localStorage.getItem('walletAddress') || ''
}

class ApiService {
  constructor() {
    this.baseURL = API_URL
    this.walletAddress = ''
    this.logger = {
      debug: (...args) => console.debug('[API]', ...args),
      info: (...args) => console.info('[API]', ...args),
      warn: (...args) => console.warn('[API]', ...args),
      error: (...args) => console.error('[API]', ...args),
    }
  }

  // Call this when wallet connects
  setWalletAddress(address) {
    this.walletAddress = address?.toLowerCase() || ''
    if (address) {
      localStorage.setItem('walletAddress', address)
    } else {
      localStorage.removeItem('walletAddress')
    }
    this.logger.info('Wallet address set:', this.walletAddress)
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // Ensure we have the latest wallet address
    if (!this.walletAddress) {
      this.walletAddress = getWalletAddress()
    }

    const config = {
      headers: {
        ...options.headers,
      },
      ...options,
    }

    // Add wallet address header for authenticated endpoints
    if (this.walletAddress && !config.headers['X-Wallet-Address']) {
      config.headers['X-Wallet-Address'] = this.walletAddress
      this.logger.debug('Adding X-Wallet-Address header:', this.walletAddress)
    }

    // Don't set Content-Type for FormData (browser will set with boundary)
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    this.logger.debug('Request:', options.method || 'GET', url, {
      headers: config.headers,
      hasBody: !!options.body
    })

    try {
      const response = await fetch(url, config)
      this.logger.debug('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error('HTTP error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Handle empty responses
      if (response.status === 204) {
        return null
      }

      const data = await response.json()
      this.logger.debug('Response data:', data)
      return data
    } catch (error) {
      this.logger.error('Request failed:', error.message)
      throw error
    }
  }

  // Health check (no auth needed)
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/users/doctors/list/`)
      return response.ok
    } catch (err) {
      this.logger.error('Health check failed:', err)
      return false
    }
  }

  // User endpoints
  async registerUser(walletAddress, role) {
    this.logger.info('Registering user:', walletAddress, role)
    // Don't set wallet header for registration (no wallet yet)
    return this.request('/users/register/', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, role }),
      headers: {} // Explicitly no wallet header
    })
  }

  async getUser(walletAddress) {
    this.logger.debug('Fetching user:', walletAddress)
    return this.request(`/users/${walletAddress}/`)
  }

  async listDoctors() {
    this.logger.debug('Listing doctors')
    return this.request('/users/doctors/list/')
  }

  // Record endpoints
  async uploadRecord(formData) {
    this.logger.info('Uploading record to backend')
    
    // Ensure wallet address is in form data as fallback
    if (!formData.has('doctor_address') && this.walletAddress) {
      formData.append('doctor_address', this.walletAddress)
    }
    
    // Log form data contents for debugging
    this.logger.debug('FormData entries:')
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        this.logger.debug(`  ${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        this.logger.debug(`  ${key}: ${value.slice ? value.slice(0, 50) + '...' : value}`)
      }
    }

    return this.request('/records/upload/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    })
  }

  async getPatientRecords(patientAddress) {
    this.logger.debug('Fetching patient records:', patientAddress)
    return this.request(`/records/patient/${patientAddress}/`)
  }

  async updateTxHash(recordId, txHash) {
    this.logger.info('Updating TX hash:', recordId, txHash)
    return this.request(`/records/${recordId}/tx/`, {
      method: 'POST',
      body: JSON.stringify({ tx_hash: txHash }),
    })
  }

  async getRecordByCid(cid) {
    this.logger.debug('Fetching record by CID:', cid)
    return this.request(`/records/cid/${cid}/`)
  }
}

// Export singleton instance
export const apiService = new ApiService()