import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useWeb3 } from './context/Web3Context';
import { ethers } from 'ethers';
import { useNavigate, Link } from 'react-router-dom';
import { db } from './context/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Settings.css';
import ThreeBackground from './ThreeBackground';



function Settings() {
  const { currentUser, logout, userRole } = useAuth();
  const { isConnected, account } = useWeb3();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(null);
  const [isBuilder, setIsBuilder] = useState(localStorage.getItem('isBuilder') === 'true');
  const [userData, setUserData] = useState(null);
  const [propertyStats, setPropertyStats] = useState({
    listed: 0,
    sold: 0,
    purchased: 0,
    totalRevenue: 0,
    totalSpent: 0
  });

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
            setUserData(userData);

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

  // Fetch property statistics
  useEffect(() => {
    if (userRole && currentUser?.uid) {
      fetchPropertyStats();
    }
  }, [userRole, currentUser]);

  const fetchPropertyStats = async () => {
    try {
      if (userRole === 'Builder') {
        // Fetch properties listed by this builder
        const q = query(
          collection(db, 'properties'),
          where('builderId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const properties = querySnapshot.docs.map(doc => doc.data());
        
        const listed = properties.length;
        const sold = properties.filter(p => p.isSold === 'Sold').length;
        const totalRevenue = properties
          .filter(p => p.isSold === 'Sold')
          .reduce((total, p) => total + (p.price || 0), 0);

        setPropertyStats({
          listed,
          sold,
          purchased: 0,
          totalRevenue,
          totalSpent: 0
        });
      } else if (userRole === 'Buyer') {
        // Fetch properties purchased by this buyer
        const q = query(
          collection(db, 'properties'),
          where('buyerId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const purchasedProperties = querySnapshot.docs.map(doc => doc.data());
        
        const purchased = purchasedProperties.length;
        const totalSpent = purchasedProperties.reduce((total, p) => total + (p.price || 0), 0);

        setPropertyStats({
          listed: 0,
          sold: 0,
          purchased,
          totalRevenue: 0,
          totalSpent
        });
      }
    } catch (error) {
      console.error('Error fetching property stats:', error);
    }
  };
  

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
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img 
              src={userData?.avatar || currentUser?.photoURL || '/user.png'} 
              alt="Profile" 
            />
          </div>
          <div className="profile-info">
            <h1>{userData?.name || currentUser?.displayName || 'User'}</h1>
            <p className="user-role">{userRole || 'User'}</p>
            <p className="user-email">{currentUser?.email}</p>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="profile-actions">
          {userRole === 'Builder' && (
            <>
              <Link to="/add-property" className="action-button primary">
                Add Property
              </Link>
              <Link to="/listed-properties" className="action-button secondary">
                Listed Properties
              </Link>
            </>
          )}
          
          {userRole === 'Buyer' && (
            <>
              <Link to="/my-purchases" className="action-button secondary">
                My Purchases
              </Link>
            </>
          )}
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          {userRole === 'Builder' && (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Properties Listed</h3>
                <p className="stat-number">{propertyStats.listed}</p>
              </div>
              <div className="stat-card">
                <h3>Properties Sold</h3>
                <p className="stat-number">{propertyStats.sold}</p>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p className="stat-number">${propertyStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {userRole === 'Buyer' && (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Properties Purchased</h3>
                <p className="stat-number">{propertyStats.purchased}</p>
              </div>
              <div className="stat-card">
                <h3>Total Spent</h3>
                <p className="stat-number">${propertyStats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>NFTs Owned</h3>
                <p className="stat-number">0</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <h2>Profile Information</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Full Name:</label>
              <span>{userData?.name || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Email:</label>
              <span>{currentUser?.email}</span>
            </div>
            <div className="detail-item">
              <label>Phone:</label>
              <span>{userData?.phone || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Address:</label>
              <span>{userData?.address || 'Not provided'}</span>
            </div>
            {userRole === 'Builder' && (
              <>
                <div className="detail-item">
                  <label>Company:</label>
                  <span>{userData?.company || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>License Number:</label>
                  <span>{userData?.licenseNumber || 'Not provided'}</span>
                </div>
              </>
            )}
            {userRole === 'Buyer' && (
              <>
                <div className="detail-item">
                  <label>Annual Income:</label>
                  <span>{userData?.annualIncome || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>PAN Number:</label>
                  <span>{userData?.panNumber || 'Not provided'}</span>
                </div>
              </>
            )}
            <div className="detail-item">
              <label>Registration Date:</label>
              <span>{userData?.registrationDate ? new Date(userData.registrationDate).toLocaleDateString() : 'Not available'}</span>
            </div>
          </div>
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

        {/* Logout Button */}
        <div className="logout-section">
          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
