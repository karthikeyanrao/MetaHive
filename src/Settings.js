import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useWeb3 } from './context/Web3Context';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { db } from './context/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Settings.css';
import ThreeBackground from './ThreeBackground';



function Settings() {
  const { currentUser, logout } = useAuth();
  const { isConnected, account } = useWeb3();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(null);
  const [isBuilder, setIsBuilder] = useState(localStorage.getItem('isBuilder') === 'true');
  const [userRole, setUserRole] = useState(null);


  const [profileData, setProfileData] = useState({
    name: '',
    email: currentUser?.email || '',
    avatar: currentUser?.photoURL || '',
    isBuilder: isBuilder
  });

  // Fetch user data including builder status from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const builderStatus = userData.isBuilder || false;
            setIsBuilder(builderStatus);
            localStorage.setItem('isBuilder', builderStatus);
            
            setProfileData(prev => ({
              ...prev,
              name: userData.name || currentUser.displayName || 'User',
              email: currentUser.email || 'No email provided',
              avatar: userData.avatar || currentUser.photoURL || '',
              isBuilder: builderStatus
            }));
            setUserRole(userData.role);
            setUserName(userData.name);
            setUserEmail(currentUser.email);

          } else {
            console.log("User document does not exist.");
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileData(prev => ({
              ...prev,
              avatar: userData.avatar || localStorage.getItem('avatar') || currentUser.photoURL || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
  
    fetchUserData();
  }, [currentUser]);
  

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
  }, [isConnected, account]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentUser?.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Check if the document exists
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          await updateDoc(userRef, {
            isBuilder: isBuilder,
            name: profileData.name,
            email: profileData.email,
            updatedAt: new Date().toISOString()
          });
        } else {
          await setDoc(userRef, {
            isBuilder: isBuilder,
            name: profileData.name,
            email: profileData.email,
            avatar: profileData.avatar, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        localStorage.setItem('isBuilder', isBuilder);
        alert('Settings saved successfully!');
        navigate('/');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert(`Error saving settings: ${error.message}`);
      }
    } else {
      alert('Please login to save settings');
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out: ' + error.message);
    }
  };

  return (
    <div>
      <ThreeBackground />
      <div className="settings-container">
        <h1>Account Settings</h1>

        <div className="settings-content">
          <div className="profile-section">
            <form onSubmit={handleSubmit} className="profile-form">

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="disabled-input"
                />
              </div>

              {/* Wallet Info */}
              <div className="wallet-info">
                <h3>Wallet Information</h3>
                <div className="wallet-details">
                  <div className="wallet-address">
                    <label>MetaMask Address:</label>
                    <span className="full-address">{account || 'Not Connected'}</span>
                  </div>
                  <div className="wallet-balance">
                    <label>MetaMask Balance:</label>
                    <span>{walletBalance ? `${Number(walletBalance).toFixed(4)} ETH` : 'N/A'}</span>
                  </div>
                </div>
              </div>

             <div>
                
                {userRole === 'Builder' && (
                  <button 
                    type="button" 
                    className="add-property-button"
                    onClick={() => navigate('/add-property')}
                  >
                    Add Property
                  </button>
                )}
              </div>

              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </form>
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default Settings;
