import React from 'react'
import { useWeb3 } from '@contexts/Web3Context.jsx'
import Button from '@components/ui/Button.jsx'
import Badge from '@components/ui/Badge.jsx'

export default function Header({ onWalletClick }) {
  const { account, isConnected } = useWeb3()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="header">
      <h1>MediChain</h1>
      <div className="flex-row">
        {!isConnected ? (
          <Button onClick={onWalletClick} primary>
            Connect Wallet
          </Button>
        ) : (
          <>
            <Button onClick={onWalletClick} className="hidden">
              Connect Wallet
            </Button>
            <Badge 
              onClick={onWalletClick} 
              connected 
              className="cursor-pointer"
            >
              {formatAddress(account)}
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}