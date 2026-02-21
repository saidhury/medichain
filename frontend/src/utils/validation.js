import { ethers } from 'ethers'

export const isValidEthereumAddress = (address) => {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

export const isValidCID = (cid) => {
  // Basic IPFS CID validation (v0 and v1)
  if (!cid || typeof cid !== 'string') return false
  // CIDv0: Qm[44 chars]
  // CIDv1: b[base32 chars]
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^b[a-z2-7]{58,}$/.test(cid)
}

export const isValidHash = (hash) => {
  if (!hash || typeof hash !== 'string') return false
  // Ethereum hex hash
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`
  }
  return null
}