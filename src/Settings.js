import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useWeb3 } from './context/Web3Context';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiGetBuilderProperties, apiGetMyPurchases, apiUpdateUserProfile } from './api';
import './Settings.css';

function Settings() {
  const { currentUser, dbUser, logout, userRole } = useAuth();
  const { isConnected, account } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'settings'
  const [isBuilder, setIsBuilder] = useState(localStorage.getItem('isBuilder') === 'true');
  const [propertyStats, setPropertyStats] = useState({
    listed: 0,
    active: 0,
    sold: 0,
    totalVolume: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const [profileData, setProfileData] = useState({
    name: '', email: '', phone: '', address: ''
  });

  useEffect(() => {
    // Determine initial tab from hash or state if we want, default to overview
    if (location.hash === '#settings') setActiveTab('settings');
    else setActiveTab('overview');
  }, [location]);

  useEffect(() => {
    if (dbUser && currentUser) {
      const builderStatus = dbUser.userType === 'builder' || dbUser.role === 'Builder' || dbUser.role === 'builder';
      setIsBuilder(builderStatus);
      localStorage.setItem('isBuilder', builderStatus);

      setProfileData({
        name: dbUser.fullName || dbUser.name || currentUser.displayName || '',
        email: currentUser.email || '',
        phone: dbUser.phone || '',
        address: dbUser.address || ''
      });
    }
  }, [dbUser, currentUser]);

  useEffect(() => {
    if (userRole && currentUser?.uid) fetchDashboardData();
  }, [userRole, currentUser]);

  const fetchDashboardData = async () => {
    try {
      if (userRole?.toLowerCase() === 'builder') {
        const properties = await apiGetBuilderProperties();

        const listed = properties.length;
        const soldProps = properties.filter(p => (p.status || '').toLowerCase() === 'sold' || (p.isSold || '').toLowerCase() === 'yes' || (p.isSold || '').toLowerCase() === 'sold');
        const soldCount = soldProps.length;
        const activeCount = listed - soldCount;

        const totalVolume = soldProps.reduce((sum, p) => sum + (p.price || p.propertyDetails?.price || 0), 0);

        setPropertyStats({ listed, active: activeCount, sold: soldCount, totalVolume });

        // Build recent activity list from properties
        const activity = properties.map(p => ({
          id: p._id,
          title: p.title || p.propertyDetails?.title || 'Unknown Property',
          date: new Date(p.createdAt || Date.now()).toLocaleDateString(),
          status: (p.status || '').toLowerCase() === 'sold' || (p.isSold || '').toLowerCase() === 'yes' || (p.isSold || '').toLowerCase() === 'sold' ? 'Sold' : 'New'
        })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        setRecentActivity(activity);

      } else if (userRole?.toLowerCase() === 'buyer') {
        const purchases = await apiGetMyPurchases();
        const purchased = purchases.length;
        const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

        setPropertyStats({ listed: 0, active: 0, sold: purchased, totalVolume: totalSpent });

        const activity = purchases.map(p => ({
          id: p._id,
          title: p.propertyId?.propertyDetails?.title || 'Property Purchase',
          date: new Date(p.createdAt || Date.now()).toLocaleDateString(),
          status: 'Purchased'
        })).slice(0, 5);

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateUserProfile({ ...profileData });
      alert('Settings saved successfully!');
    } catch (error) {
      alert(`Error saving settings: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">

      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>{userRole?.toLowerCase() === 'builder' ? 'Builder Portal' : 'Buyer Portal'}</h2>
          <p className="sidebar-subtitle">Nexus</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-th-large"></i> Overview
          </button>

          {userRole?.toLowerCase() === 'builder' ? (
            <>
              <Link to="/listed-properties" className="nav-item">
                <i className="fas fa-list"></i> My Listings
              </Link>
              <Link to="/add-property" className="nav-item">
                <i className="fas fa-plus"></i> Add Property
              </Link>
            </>
          ) : (
            <Link to="/my-purchases" className="nav-item">
              <i className="fas fa-shopping-bag"></i> My Purchases
            </Link>
          )}

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="signout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-header">
              <h1>Dashboard Overview</h1>
            </div>

            <div className="stats-grid">
              {userRole?.toLowerCase() === 'builder' ? (
                <>
                  <div className="stat-card">
                    <h3>Total Listings</h3>
                    <p className="stat-number">{propertyStats.listed}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Active For Sale</h3>
                    <p className="stat-number">{propertyStats.active}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Properties Sold</h3>
                    <p className="stat-number">{propertyStats.sold}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Volume</h3>
                    <p className="stat-number">${propertyStats.totalVolume.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-card">
                    <h3>Properties Purchased</h3>
                    <p className="stat-number">{propertyStats.sold}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Spent</h3>
                    <p className="stat-number">${propertyStats.totalVolume.toLocaleString()}</p>
                  </div>
                  <div className="stat-card" style={{ opacity: 0.5 }}><h3>NFTs Owned</h3><p className="stat-number">...</p></div>
                  <div className="stat-card" style={{ opacity: 0 }}></div>
                </>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>No recent activity found.</p>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity, idx) => (
                    <div className="activity-item" key={idx}>
                      <div className="activity-info">
                        <span className="activity-title">{activity.title}</span>
                        <span className="activity-date">{activity.date}</span>
                      </div>
                      <span className={`activity-status ${activity.status.toLowerCase()}`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div className="dashboard-header">
              <h1>Profile Settings</h1>
            </div>

            <form className="settings-form" onSubmit={handleProfileSubmit}>
              <div className="detail-item">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="detail-item">
                <label>Email Address</label>
                <input type="email" value={profileData.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <div className="detail-item">
                <label>Address / Company</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                />
              </div>

              <div className="detail-item" style={{ marginTop: '32px' }}>
                <label>Wallet Address</label>
                <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>
                  {account || 'Not connected'}
                </p>
              </div>

              <div style={{ marginTop: '40px' }}>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default Settings;
