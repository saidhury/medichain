const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY

class IPFSService {
  constructor() {
    this.apiKey = PINATA_API_KEY
    this.secretKey = PINATA_SECRET_KEY
    this.logger = {
      debug: (...args) => console.debug('[IPFS]', ...args),
      info: (...args) => console.info('[IPFS]', ...args),
      warn: (...args) => console.warn('[IPFS]', ...args),
      error: (...args) => console.error('[IPFS]', ...args),
    }

    if (!this.apiKey || !this.secretKey) {
      this.logger.warn('Pinata credentials not configured, IPFS uploads will fail')
    }
  }

  async uploadFile(file, filename) {
    this.logger.info('Uploading to IPFS:', filename, `${(file.size / 1024).toFixed(2)}KB`)
    
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API keys not configured')
    }

    const formData = new FormData()
    formData.append('file', file, filename)

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        this.logger.error('Pinata upload failed:', error)
        throw new Error(`IPFS upload failed: ${error}`)
      }

      const data = await response.json()
      this.logger.info('IPFS upload successful, CID:', data.IpfsHash)
      return data.IpfsHash
    } catch (error) {
      this.logger.error('IPFS upload error:', error.message)
      throw error
    }
  }

  async uploadJSON(jsonData, filename = 'metadata.json') {
    this.logger.info('Uploading JSON to IPFS:', filename)
    
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API keys not configured')
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: JSON.stringify({
          pinataContent: jsonData,
          pinataMetadata: { name: filename }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        this.logger.error('Pinata JSON upload failed:', error)
        throw new Error(`IPFS JSON upload failed: ${error}`)
      }

      const data = await response.json()
      this.logger.info('IPFS JSON upload successful, CID:', data.IpfsHash)
      return data.IpfsHash
    } catch (error) {
      this.logger.error('IPFS JSON upload error:', error.message)
      throw error
    }
  }

  getGatewayUrl(cid) {
    return `https://gateway.pinata.cloud/ipfs/${cid}`
  }

  async testConnection() {
    try {
      // Test by checking if we can access Pinata's data endpoint
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        }
      })
      const ok = response.ok
      this.logger.info('Pinata connection test:', ok ? 'OK' : 'FAIL')
      return ok
    } catch (err) {
      this.logger.error('Pinata connection test failed:', err.message)
      return false
    }
  }
}

export const ipfsService = new IPFSService()