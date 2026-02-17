import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, LogOut, User } from 'lucide-react';

const Navbar = ({ account, role, onConnect, onDisconnect, isConnecting }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        🏥 MedicalChain
      </Link>
      
      <div className="wallet-info">
        {account ? (
          <>
            <span className="badge badge-verified">
              <User size={14} style={{ marginRight: '4px' }} />
              {role?.charAt(0).toUpperCase() + role?.slice(1)}
            </span>
            <span className="address">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button className="btn btn-danger" onClick={onDisconnect}>
              <LogOut size={16} />
              Disconnect
            </button>
          </>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={onConnect}
            disabled={isConnecting}
          >
            <Wallet size={16} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;