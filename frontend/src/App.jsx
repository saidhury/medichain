import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import { useWallet } from './hooks/useWallet';

function App() {
  const { account, role, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if wallet was previously connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
      setIsReady(true);
    };
    
    checkConnection();
  }, []);

  if (!isReady) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar 
          account={account} 
          role={role} 
          onConnect={connectWallet} 
          onDisconnect={disconnectWallet}
          isConnecting={isConnecting}
        />
        
        <main className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                !account ? (
                  <Landing onConnect={connectWallet} isConnecting={isConnecting} />
                ) : role === 'patient' ? (
                  <Navigate to="/patient" replace />
                ) : role === 'doctor' ? (
                  <Navigate to="/doctor" replace />
                ) : (
                  <Landing onConnect={connectWallet} isConnecting={isConnecting} showRoleSelect={true} />
                )
              } 
            />
            <Route 
              path="/patient" 
              element={
                account && role === 'patient' ? (
                  <PatientDashboard account={account} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/doctor" 
              element={
                account && role === 'doctor' ? (
                  <DoctorDashboard account={account} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;