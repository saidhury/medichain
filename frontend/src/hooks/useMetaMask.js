import { useCallback } from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'

export function useMetaMask() {
  const { connect, disconnect, account, isConnected, addLog } = useWeb3()

  const formatAddress = useCallback((addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  const copyAddress = useCallback(async () => {
    if (!account) return
    try {
      await navigator.clipboard.writeText(account)
      addLog('Address copied to clipboard', 'info')
    } catch (err) {
      addLog('Failed to copy address', 'error')
    }
  }, [account, addLog])

  const viewOnExplorer = useCallback(() => {
    if (!account) return
    window.open(`https://sepolia.etherscan.io/address/${account}`, '_blank')
  }, [account])

  return {
    connect,
    disconnect,
    account,
    isConnected,
    formatAddress,
    copyAddress,
    viewOnExplorer,
  }
}