import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import { useWallet } from './hooks/useWallet';

function App() {
  const { 
    account, 
    role, 
    connectWallet,
    disconnectWallet, 
    isConnecting,
    isMetaMaskConnected,
    error
  } = useWallet();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to let MetaMask detection happen
    setTimeout(() => setIsReady(true), 500);
  }, []);

  if (!isReady) {
    return (
      <div className="landing">
        <div className="hero">
          <div className="spin" style={{ 
            width: 48, height: 48, 
            border: '4px solid var(--primary)', 
            borderTopColor: 'transparent', 
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }}></div>
          <p>Detecting MetaMask...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!account) {
    return (
      <Router>
        <Login 
          onConnect={connectWallet}
          isConnecting={isConnecting}
          error={error}
        />
      </Router>
    );
  }

  // Logged in - show dashboard
  return (
    <Router>
      <div className="app">
        <Navbar 
          account={account} 
          role={role} 
          isMetaMaskConnected={isMetaMaskConnected}
          onDisconnect={disconnectWallet}
        />
        
        <main className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                role === 'patient' ? <Navigate to="/patient" replace /> :
                role === 'doctor' ? <Navigate to="/doctor" replace /> :
                <Navigate to="/" replace />
              } 
            />
            <Route 
              path="/patient" 
              element={role === 'patient' ? <PatientDashboard account={account} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/doctor" 
              element={role === 'doctor' ? <DoctorDashboard account={account} /> : <Navigate to="/" replace />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;