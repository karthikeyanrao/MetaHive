import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from './context/Web3Context';
import { useAuth } from './context/AuthContext';
import { ethers } from 'ethers';
import './Navbar.css';
import meta from './meta.png';
import user from './user.png';

function Navbar() {
  const location = useLocation();
  const { isConnected, connectWallet, disconnectWallet, account } = useWeb3();
  const { currentUser, logout } = useAuth();
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(account);
          setWalletBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };
  
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Fetch every 10s 
  
    return () => clearInterval(interval);
  }, [isConnected, account]);
  

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate('/');
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   }
  // };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Invest and Ingest</Link>
      </div>
      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link 
              to="/properties" 
              className={location.pathname === '/properties' ? 'active' : ''}
            >
              Browse Properties
            </Link>
            
            <div className="account-section">
              <div className="wallet-container">
              <button 
  onClick={() => setShowWalletDropdown(!showWalletDropdown)} 
  className="wallet-button"
>
  {isConnected ? (
    <>
      <i className="fas fa-wallet"></i>
      <img src={meta}  className="wallet-avatar" />
      <i className="fas fa-chevron-down"></i>
    </>
  ) : (
    <span onClick={connectWallet}>Connect Wallet</span>
  )}
</button>

                
                {showWalletDropdown && isConnected && (
                  <div className="wallet-dropdown">
                    <div className="wallet-info">
                      <div className="wallet-address">
                        <span>Address:</span>
                        <span>{`${account?.slice(0, 6)}...${account?.slice(-4)}`}</span>
                      </div>
                      <div className="wallet-balance">
                        <span>Balance:</span>
                        <span>{walletBalance ? `${Number(walletBalance).toFixed(4)} ETH` : 'Loading...'}</span>
                      </div>
                      <button onClick={disconnectWallet} className="disconnect-button">
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-profile">
                <button 
                  className="avatar-button"
                  onClick={handleSettingsClick}
                >
                  <i className="fas fa-user-circle"></i>
                  <img src={user}  className="wallet-avatar" />
                </button>
                {/* <button onClick={handleLogout} className="logout-button">
                  Logout
                </button> */}
              </div>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <div className="register-dropdown">
              <button 
                className="register-button"
                onMouseEnter={() => setShowRegisterDropdown(true)}
                onMouseLeave={() => setShowRegisterDropdown(false)}
              >
                Register
                {showRegisterDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/register/builder" className="dropdown-item">Builder</Link>
                    <Link to="/register/buyer" className="dropdown-item">Buyer</Link>
                  </div>
                )}
              </button>
            </div>
            <Link to="/login" className="login-nav-button">
              Login 
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 