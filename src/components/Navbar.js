import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import '../Navbar.css';
import { CgProfile } from "react-icons/cg";
import userImg from '../user.png';

function Navbar() {
  const location = useLocation();
  const { isConnected, connectWallet, disconnectWallet, account } = useWeb3();
  const { currentUser, userRole, logout } = useAuth();
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const walletRef = useRef(null);
  const regRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (walletRef.current && !walletRef.current.contains(e.target)) setShowWalletDropdown(false);
      if (regRef.current && !regRef.current.contains(e.target)) setShowRegisterDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(account);
          setWalletBalance(ethers.formatEther(balance));
        } catch (e) {
          console.error('Balance fetch error:', e);
        }
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 12000);
    return () => clearInterval(interval);
  }, [isConnected, account]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`mh-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="mh-navbar-inner">

        {/* Brand */}
        <Link to="/" className="mh-brand">METAHIVE</Link>

        {/* Nav Links */}
        <div className="mh-nav-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link to="/properties" className={isActive('/properties') ? 'active' : ''}>Properties</Link>
          <a href="/#how-it-works">How It Works</a>
        </div>

        {/* Auth area */}
        <div className="mh-auth">
          {currentUser ? (
            <>
              {/* Wallet */}
              <div className="mh-wallet-wrap" ref={walletRef}>
                {isConnected ? (
                  <>
                    <button
                      className="mh-wallet-connected"
                      onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    >
                      <span className="wallet-dot"></span>
                      {`${account?.slice(0, 6)}...${account?.slice(-4)}`}
                    </button>
                    {showWalletDropdown && (
                      <div className="mh-wallet-dropdown">
                        <div className="wdrop-row">
                          <span className="wdrop-label">Address</span>
                          <span className="wdrop-val mono">{account?.slice(0, 12)}...{account?.slice(-6)}</span>
                        </div>
                        <div className="wdrop-row">
                          <span className="wdrop-label">Balance</span>
                          <span className="wdrop-val">{walletBalance ? `${Number(walletBalance).toFixed(4)} ETH` : '—'}</span>
                        </div>
                        <button onClick={disconnectWallet} className="wdrop-disconnect">
                          Disconnect
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button className="mh-btn-wallet" onClick={connectWallet}>
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Profile icon */}
              <button
                className="mh-avatar-btn"
                onClick={() => navigate('/settings')}
                title="Profile"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px' }}
              >
                <CgProfile style={{ fontSize: '3.5rem', color: '#ffffff' }} />
              </button>


            </>
          ) : (
            <>
              {/* Connect Wallet */}
              <button className="mh-btn-wallet" onClick={connectWallet}>
                Connect Wallet
              </button>

              {/* Register dropdown */}
              <div className="mh-reg-wrap" ref={regRef}>
                <button
                  className="mh-btn-ghost"
                  onMouseEnter={() => setShowRegisterDropdown(true)}
                  onMouseLeave={() => setShowRegisterDropdown(false)}
                  onClick={() => setShowRegisterDropdown(!showRegisterDropdown)}
                >
                  Register
                  {showRegisterDropdown && (
                    <div className="mh-reg-dropdown">
                      <Link to="/register/builder" className="mh-reg-item">Builder</Link>
                      <Link to="/register/buyer" className="mh-reg-item">Buyer</Link>
                    </div>
                  )}
                </button>
              </div>

              <Link to="/login" className="mh-btn-login">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
