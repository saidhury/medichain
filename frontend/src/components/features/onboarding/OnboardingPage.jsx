import React, { useState } from 'react'
import Button from '@components/ui/Button.jsx'
import Card from '@components/ui/Card.jsx'

const STEPS = {
  METAMASK: 'metamask',
  NETWORK: 'network',
  WALLET: 'wallet',
  FAUCET: 'faucet',
  CONNECT: 'connect',
}

const OnboardingPage = ({ onConnect }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.METAMASK)
  const [completedSteps, setCompletedSteps] = useState([])

  const markComplete = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
    }
    // Auto-advance to next step
    const stepOrder = [STEPS.METAMASK, STEPS.NETWORK, STEPS.WALLET, STEPS.FAUCET, STEPS.CONNECT]
    const currentIndex = stepOrder.indexOf(step)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const isStepComplete = (step) => completedSteps.includes(step)

  const StepIndicator = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '12px', 
      marginBottom: '32px',
      flexWrap: 'wrap'
    }}>
      {[
        { id: STEPS.METAMASK, label: '1. Install', icon: '🦊' },
        { id: STEPS.NETWORK, label: '2. Network', icon: '🌐' },
        { id: STEPS.WALLET, label: '3. Create', icon: '👛' },
        { id: STEPS.FAUCET, label: '4. Funds', icon: '💧' },
        { id: STEPS.CONNECT, label: '5. Connect', icon: '🔗' },
      ].map((step) => (
        <div
          key={step.id}
          onClick={() => setCurrentStep(step.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            background: currentStep === step.id ? 'var(--primary-soft)' : 
                       isStepComplete(step.id) ? 'var(--secondary-soft)' : 'var(--bg-input)',
            border: `2px solid ${currentStep === step.id ? 'var(--primary)' : 
                              isStepComplete(step.id) ? 'var(--secondary)' : 'var(--border)'}`,
            opacity: isStepComplete(step.id) ? 0.9 : 1,
            transition: 'all 0.2s ease',
            minWidth: '80px'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600,
            color: currentStep === step.id ? 'var(--primary)' : 
                  isStepComplete(step.id) ? 'var(--secondary)' : 'var(--text-muted)'
          }}>
            {isStepComplete(step.id) ? '✓ ' + step.label : step.label}
          </span>
        </div>
      ))}
    </div>
  )

  const StepContent = () => {
    switch (currentStep) {
      case STEPS.METAMASK:
        return <MetaMaskStep onComplete={() => markComplete(STEPS.METAMASK)} />
      case STEPS.NETWORK:
        return <NetworkStep onComplete={() => markComplete(STEPS.NETWORK)} />
      case STEPS.WALLET:
        return <WalletStep onComplete={() => markComplete(STEPS.WALLET)} />
      case STEPS.FAUCET:
        return <FaucetStep onComplete={() => markComplete(STEPS.FAUCET)} />
      case STEPS.CONNECT:
        return <ConnectStep onConnect={onConnect} onComplete={() => markComplete(STEPS.CONNECT)} />
      default:
        return null
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Welcome to MediChain</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
          Secure, decentralized medical records on the blockchain
        </p>
      </div>

      <StepIndicator />
      
      <StepContent />

      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        background: 'var(--accent-soft)', 
        borderRadius: '16px',
        border: '1px solid var(--accent)',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)' }}>
          <strong>Need help?</strong> Contact support at{' '}
          <a href="mailto:support@medichain.example" style={{ color: 'var(--primary)' }}>
            support@medichain.example
          </a>
        </p>
      </div>
    </div>
  )
}

// Step 1: Install MetaMask
const MetaMaskStep = ({ onComplete }) => (
  <Card>
    <div className="section-title" style={{ fontSize: '1.25rem' }}>Step 1: Install MetaMask</div>
    
    <div style={{ marginBottom: '24px' }}>
      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        MetaMask is a crypto wallet that connects your browser to the blockchain. 
        It's required to use MediChain securely.
      </p>
    </div>

    <div style={{ 
      display: 'grid', 
      gap: '16px',
      marginBottom: '24px'
    }}>
      <a 
        href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          padding: '20px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '2px solid var(--border)',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'all 0.2s ease'
        }}
        className="hover-card"
      >
        <span style={{ fontSize: '2rem' }}>🌐</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Chrome / Edge / Brave</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Install from Chrome Web Store
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>→</span>
      </a>

      <a 
        href="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          padding: '20px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '2px solid var(--border)',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '2rem' }}>🦊</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Firefox</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Install from Firefox Add-ons
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>→</span>
      </a>

      <a 
        href="https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          padding: '20px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '2px solid var(--border)',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '2rem' }}>📱</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>iOS / Android</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Install from App Store or Play Store
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>→</span>
      </a>
    </div>

    <div style={{ 
      padding: '16px', 
      background: 'var(--bg-input)', 
      borderRadius: '12px',
      marginBottom: '24px'
    }}>
      <h4 style={{ marginTop: 0, marginBottom: '12px' }}>⚠️ Important Security Tips:</h4>
      <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
        <li>Only download MetaMask from official sources (links above)</li>
        <li><strong>Never</strong> share your Secret Recovery Phrase with anyone</li>
        <li>MediChain will never ask for your private keys or seed phrase</li>
        <li>Store your Secret Recovery Phrase in a safe, offline location</li>
      </ul>
    </div>

    <Button onClick={onComplete} primary fullWidth>
      I've Installed MetaMask →
    </Button>
  </Card>
)

// Step 2: Add Sepolia Network
const NetworkStep = ({ onComplete }) => {
  const [showManual, setShowManual] = useState(false)

  const addSepoliaAuto = async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install it first.')
      return
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia
      })
      alert('Sepolia network added successfully!')
      onComplete()
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Network not added, try adding it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.infura.io'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          })
          onComplete()
        } catch (addError) {
          console.error('Failed to add network:', addError)
          setShowManual(true)
        }
      } else {
        setShowManual(true)
      }
    }
  }

  return (
    <Card>
      <div className="section-title" style={{ fontSize: '1.25rem' }}>Step 2: Add Sepolia Test Network</div>
      
      <div style={{ marginBottom: '24px' }}>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          MediChain runs on the <strong>Sepolia Test Network</strong> (a free Ethereum testnet). 
          You need to add this network to MetaMask.
        </p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--secondary-soft)', 
        borderRadius: '16px',
        marginBottom: '24px',
        border: '2px solid var(--secondary-light)'
      }}>
        <h4 style={{ marginTop: 0, color: 'var(--secondary)', marginBottom: '12px' }}>
          🚀 Quick Auto-Add (Recommended)
        </h4>
        <p style={{ marginBottom: '16px', color: 'var(--text)' }}>
          Click the button below to automatically add Sepolia to MetaMask:
        </p>
        <Button onClick={addSepoliaAuto} secondary fullWidth>
          Add Sepolia Network to MetaMask
        </Button>
      </div>

      <details style={{ marginBottom: '24px' }}>
        <summary 
          onClick={() => setShowManual(!showManual)}
          style={{ 
            cursor: 'pointer', 
            color: 'var(--text-muted)',
            fontSize: '0.9375rem',
            userSelect: 'none'
          }}
        >
          {showManual ? '▼' : '▶'} Manual Setup (if auto-add doesn't work)
        </summary>
        
        {showManual && (
          <div style={{ 
            marginTop: '16px',
            padding: '20px',
            background: 'var(--bg-input)',
            borderRadius: '12px'
          }}>
            <ol style={{ lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
              <li>Open MetaMask and click the <strong>network dropdown</strong> (top of the popup)</li>
              <li>Click <strong>"Add Network"</strong> or <strong>"Custom RPC"</strong></li>
              <li>Enter these details:
                <ul style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                  <li><strong>Network Name:</strong> Sepolia Test Network</li>
                  <li><strong>RPC URL:</strong> https://rpc.sepolia.org</li>
                  <li><strong>Chain ID:</strong> 11155111 (or 0xaa36a7 in hex)</li>
                  <li><strong>Currency Symbol:</strong> ETH</li>
                  <li><strong>Block Explorer:</strong> https://sepolia.etherscan.io</li>
                </ul>
              </li>
              <li>Click <strong>Save</strong></li>
            </ol>
          </div>
        )}
      </details>

      <div style={{ 
        padding: '16px', 
        background: 'var(--accent-soft)', 
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          <strong>💡 Why Sepolia?</strong> It's a test network with fake ETH, so you can try 
          MediChain without spending real money. All transactions are free!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Button onClick={() => window.open('https://sepolia.dev', '_blank')} ghost style={{ flex: 1 }}>
          Learn More About Sepolia
        </Button>
        <Button onClick={onComplete} primary style={{ flex: 2 }}>
          Sepolia Added →
        </Button>
      </div>
    </Card>
  )
}

// Step 3: Create Wallet
const WalletStep = ({ onComplete }) => (
  <Card>
    <div className="section-title" style={{ fontSize: '1.25rem' }}>Step 3: Create Your Wallet</div>
    
    <div style={{ marginBottom: '24px' }}>
      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        If you already have a MetaMask wallet, you can skip this step. 
        Otherwise, follow these steps to create a new secure wallet.
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-input)', 
        borderRadius: '16px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600
          }}>1</span>
          <h4 style={{ margin: 0 }}>Click "Create a new wallet"</h4>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          When you first open MetaMask, choose "Create a new wallet" (or "Import" if you have an existing seed phrase)
        </p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-input)', 
        borderRadius: '16px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600
          }}>2</span>
          <h4 style={{ margin: 0 }}>Set a Strong Password</h4>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          This password locks your MetaMask on this device. Make it unique and memorable.
        </p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--primary-soft)', 
        borderRadius: '16px',
        border: '2px solid var(--primary)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600
          }}>3</span>
          <h4 style={{ margin: 0, color: 'var(--primary)' }}>⚠️ Secure Your Secret Recovery Phrase</h4>
        </div>
        <ul style={{ 
          margin: '0 0 16px 0', 
          paddingLeft: '20px', 
          color: 'var(--text)',
          lineHeight: '1.8'
        }}>
          <li>MetaMask will show you 12 words. This is your <strong>master key</strong></li>
          <li><strong>Write it down on paper</strong> and store it somewhere safe</li>
          <li><strong>Never</strong> save it digitally (no screenshots, no emails)</li>
          <li>Anyone with these words can access your wallet</li>
          <li>You'll need these words to recover your wallet if you lose your device</li>
        </ul>
        <div style={{ 
          padding: '12px', 
          background: 'var(--bg-card)', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: 'var(--danger)',
          fontWeight: 500
        }}>
          🔒 MediChain will never ask for your Secret Recovery Phrase. 
          If anyone asks, it's a scam!
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-input)', 
        borderRadius: '16px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600
          }}>4</span>
          <h4 style={{ margin: 0 }}>Confirm Your Recovery Phrase</h4>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          MetaMask will ask you to confirm some words from your phrase to ensure you wrote it down correctly.
        </p>
      </div>
    </div>

    <div style={{ marginTop: '24px' }}>
      <Button onClick={onComplete} primary fullWidth>
        Wallet Created →
      </Button>
    </div>
  </Card>
)

// Step 4: Get Test ETH
const FaucetStep = ({ onComplete }) => {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!window.ethereum) return
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      await navigator.clipboard.writeText(accounts[0])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card>
      <div className="section-title" style={{ fontSize: '1.25rem' }}>Step 4: Get Free Test ETH</div>
      
      <div style={{ marginBottom: '24px' }}>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          To use MediChain (even though it's free), you need a small amount of Sepolia ETH 
          for "gas" (transaction fees). Here's how to get free test ETH from faucets.
        </p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-input)', 
        borderRadius: '16px',
        marginBottom: '24px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Your Wallet Address</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          You'll need to provide this address to receive test ETH:
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Button onClick={copyAddress} secondary>
            {copied ? '✓ Copied!' : '📋 Copy My Address'}
          </Button>
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)',
            alignSelf: 'center'
          }}>
            (Click to copy from MetaMask)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <a 
          href="https://sepoliafaucet.com" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            padding: '20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '2px solid var(--border)',
            textDecoration: 'none',
            color: 'var(--text)'
          }}
        >
          <span style={{ fontSize: '2rem' }}>🚰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Sepolia Faucet #1</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              sepoliafaucet.com - 0.5 ETH/day
            </div>
          </div>
          <span style={{ color: 'var(--primary)' }}>→</span>
        </a>

        <a 
          href="https://faucet.quicknode.com/ethereum/sepolia" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            padding: '20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '2px solid var(--border)',
            textDecoration: 'none',
            color: 'var(--text)'
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>QuickNode Faucet</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              quicknode.com - Fast and reliable
            </div>
          </div>
          <span style={{ color: 'var(--primary)' }}>→</span>
        </a>

        <a 
          href="https://www.alchemy.com/faucets/ethereum-sepolia" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            padding: '20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '2px solid var(--border)',
            textDecoration: 'none',
            color: 'var(--text)'
          }}
        >
          <span style={{ fontSize: '2rem' }}>🔷</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Alchemy Faucet</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              alchemy.com - Requires free signup
            </div>
          </div>
          <span style={{ color: 'var(--primary)' }}>→</span>
        </a>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'var(--accent-soft)', 
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '8px' }}>💡 Pro Tips:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9375rem', lineHeight: '1.8' }}>
          <li>Most faucets require your wallet address (copy it above)</li>
          <li>Some require you to create a free account</li>
          <li>0.1 ETH is more than enough for testing MediChain</li>
          <li>If one faucet is empty, try another</li>
          <li>ETH will appear in your MetaMask within 1-2 minutes</li>
        </ul>
      </div>

      <Button onClick={onComplete} primary fullWidth>
        I Have Test ETH →
      </Button>
    </Card>
  )
}

// Step 5: Connect to MediChain
const ConnectStep = ({ onConnect, onComplete }) => {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const success = await onConnect()
      if (success) {
        onComplete()
      } else {
        setError('Connection failed. Please make sure MetaMask is unlocked and on Sepolia network.')
      }
    } catch (err) {
      setError(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Card>
      <div className="section-title" style={{ fontSize: '1.25rem' }}>Step 5: Connect to MediChain</div>
      
      <div style={{ marginBottom: '24px' }}>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          You're all set! Click the button below to connect your wallet to MediChain.
        </p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'var(--secondary-soft)', 
        borderRadius: '16px',
        marginBottom: '24px',
        border: '2px solid var(--secondary-light)',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '3rem' }}>🎉</span>
        <h3 style={{ margin: '12px 0', color: 'var(--secondary)' }}>Ready to Connect!</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          MetaMask installed ✓<br/>
          Sepolia network added ✓<br/>
          Wallet created ✓<br/>
          Test ETH received ✓
        </p>
      </div>

      {error && (
        <div style={{ 
          padding: '16px', 
          background: 'var(--primary-soft)', 
          color: 'var(--primary)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      <Button 
        onClick={handleConnect} 
        primary 
        fullWidth 
        loading={connecting}
        style={{ fontSize: '1.125rem', padding: '20px' }}
      >
        {connecting ? 'Connecting...' : '🔗 Connect Wallet to MediChain'}
      </Button>

      <div style={{ 
        marginTop: '20px',
        padding: '16px', 
        background: 'var(--bg-input)', 
        borderRadius: '12px',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
      }}>
        <strong>What happens when you connect?</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>MediChain will request permission to see your wallet address</li>
          <li>We cannot access your funds without your approval</li>
          <li>All transactions will require your explicit confirmation in MetaMask</li>
          <li>Your medical data remains encrypted and under your control</li>
        </ul>
      </div>
    </Card>
  )
}

export default OnboardingPage