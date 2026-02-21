const ENCRYPTION_URL = import.meta.env.VITE_ENCRYPTION_API_URL || 'http://localhost:8001'

class EncryptionService {
  constructor() {
    this.baseURL = ENCRYPTION_URL
    this.logger = {
      debug: (...args) => console.debug('[ENCRYPTION]', ...args),
      info: (...args) => console.info('[ENCRYPTION]', ...args),
      warn: (...args) => console.warn('[ENCRYPTION]', ...args),
      error: (...args) => console.error('[ENCRYPTION]', ...args),
    }
  }

  async healthCheck() {
    try {
      this.logger.debug('Health check to:', `${this.baseURL}/health`)
      const response = await fetch(`${this.baseURL}/health`)
      const ok = response.ok
      this.logger.info('Encryption service health:', ok ? 'OK' : 'FAIL')
      return ok
    } catch (err) {
      this.logger.error('Encryption service unavailable:', err.message)
      return false
    }
  }

  async encryptFile(file) {
    this.logger.info('Encrypting file:', file.name, `${(file.size / 1024).toFixed(2)}KB`)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${this.baseURL}/encrypt`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Encryption failed: ${error}`)
      }

      const data = await response.json()
      this.logger.info('Encryption successful, hash:', data.hash?.slice(0, 20) + '...')
      this.logger.debug('Encryption result:', {
        iv: data.iv?.slice(0, 20) + '...',
        key: data.key?.slice(0, 20) + '...',
        hash: data.hash,
        size: data.encrypted_content?.length
      })
      
      return data
    } catch (error) {
      this.logger.error('Encryption error:', error.message)
      throw error
    }
  }

  async decryptFile(encryptedContent, iv, key) {
    this.logger.info('Decrypting file...')
    
    const formData = new FormData()
    formData.append('encrypted_content', encryptedContent)
    formData.append('iv', iv)
    formData.append('key', key)

    try {
      const response = await fetch(`${this.baseURL}/decrypt`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Decryption failed: ${error}`)
      }

      const data = await response.json()
      this.logger.info('Decryption successful, size:', data.size)
      return data
    } catch (error) {
      this.logger.error('Decryption error:', error.message)
      throw error
    }
  }

  async verifyFile(file, expectedHash) {
    this.logger.info('Verifying file integrity, expected hash:', expectedHash?.slice(0, 20) + '...')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('expected_hash', expectedHash)

    try {
      const response = await fetch(`${this.baseURL}/verify`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Verification failed: ${error}`)
      }

      const data = await response.json()
      this.logger.info('Verification result:', data.verified ? 'VERIFIED' : 'TAMPERED')
      this.logger.debug('Verification details:', {
        computed: data.computed_hash?.slice(0, 20) + '...',
        expected: data.expected_hash?.slice(0, 20) + '...',
        tampered: data.tampered
      })
      
      return data
    } catch (error) {
      this.logger.error('Verification error:', error.message)
      throw error
    }
  }
}

export const encryptionService = new EncryptionService()