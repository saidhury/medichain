import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, LogOut, User, Stethoscope, AlertTriangle } from 'lucide-react';

const Navbar = ({ account, role, isManualLogin, onDisconnect }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        🏥 MedicalChain
      </Link>
      
      <div className="wallet-info">
        {isManualLogin && (
          <span 
            className="badge" 
            style={{ 
              background: 'rgba(245, 158, 11, 0.2)', 
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Using test login - blockchain features disabled"
          >
            <AlertTriangle size={14} />
            Test Mode
          </span>
        )}
        
        <span className={`badge badge-${role}`}>
          {role === 'patient' ? <User size={16} /> : <Stethoscope size={16} />}
          {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </span>
        
        <span className="address" title={account}>
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
        
        <button className="btn btn-danger" onClick={onDisconnect}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;