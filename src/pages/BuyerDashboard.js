import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { apiGetMyPurchases } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import './BuyerDashboard.css';
import ThreeBackground from '../ThreeBackground';

function MyPurchases() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [purchasedProperties, setPurchasedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Consider lowercase 'buyer' as well as uppercase 'Buyer'
  const isBuyer = userRole?.toLowerCase() === 'buyer';

  useEffect(() => {
    if (isBuyer && currentUser?.uid) {
      fetchPurchasedProperties();
    } else {
      setLoading(false);
    }
  }, [currentUser, userRole, isBuyer]);

  const fetchPurchasedProperties = async () => {
    try {
      const data = await apiGetMyPurchases();

      const purchasedPropertiesData = data.map((doc) => {
        const pDetails = doc.propertyId?.propertyDetails || {};
        return {
          id: doc.propertyId?._id || doc._id,
          purchaseId: doc._id,
          title: pDetails.title,
          price: doc.amount || pDetails.price,
          location: pDetails.address,
          bedrooms: pDetails.bedrooms,
          bathrooms: pDetails.bathrooms,
          area: pDetails.area,
          // NftMinted is checked from the root property doc, then fallback to pDetails
          NftMinted: doc.propertyId?.NftMinted || pDetails.NftMinted || 'No',
          builderName: doc.propertyId?.builderName || 'Unknown Builder',
          // Use the purchase creation date
          soldAt: doc.createdAt
        };
      });

      setPurchasedProperties(purchasedPropertiesData);
    } catch (error) {
      console.error('Error fetching purchased properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <ThreeBackground />
        <div className="my-purchases-container">
          <div className="loading">Loading your purchases...</div>
        </div>
      </>
    );
  }

  if (!isBuyer) {
    return (
      <>
        <ThreeBackground />
        <div className="my-purchases-container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only buyers can view their purchased properties.</p>
            <Link to="/" className="home-link">Go Home</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThreeBackground />
      <div className="my-purchases-container">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>

        <div className="page-header">
          <h1>My Purchased Properties</h1>
          <Link to="/properties" className="browse-properties-btn">
            Browse More Properties
          </Link>
        </div>

        {purchasedProperties.length === 0 ? (
          <div className="no-purchases">
            <h3>No purchases yet</h3>
            <p>You haven't purchased any properties yet.</p>
            <Link to="/properties" className="browse-properties-btn">
              Browse Properties
            </Link>
          </div>
        ) : (
          <>
            <div className="purchase-summary">
              <div className="summary-card">
                <h3>Total Properties</h3>
                <p className="summary-number">{purchasedProperties.length}</p>
              </div>
              <div className="summary-card">
                <h3>Total Spent</h3>
                <p className="summary-number">
                  ${purchasedProperties.reduce((total, prop) => total + (prop.price || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="summary-card">
                <h3>NFTs Owned</h3>
                <p className="summary-number">
                  {purchasedProperties.filter(prop => prop.NftMinted === 'Yes').length}
                </p>
              </div>
            </div>

            <div className="properties-grid">
              {purchasedProperties.map((property) => (
                <div key={property.id} className="purchase-card">
                  <div className="purchase-status">
                    <span className="status-badge purchased">Purchased</span>
                    {property.NftMinted === 'Yes' && (
                      <span className="nft-badge">NFT Minted</span>
                    )}
                  </div>

                  <Link to={`/property/${property.id}`} className="property-link">
                    <div className="property-image">
                      <img src="/home.png" alt={property.title} />
                    </div>
                    <div className="property-info">
                      <h3>{property.title}</h3>
                      <p className="price">${property.price?.toLocaleString()}</p>
                      <p className="location">{property.location}</p>
                      <p className="details">
                        {property.bedrooms} beds • {property.bathrooms} baths • {property.area} sqft
                      </p>
                      <p className="builder">Built by: {property.builderName}</p>
                    </div>
                  </Link>

                  <div className="purchase-actions">
                    <Link to={`/property/${property.id}`} className="action-btn view">
                      View Details
                    </Link>
                    {property.NftMinted === 'Yes' && (
                      <Link to="/badges" className="action-btn nft">
                        View NFT
                      </Link>
                    )}
                    <button className="action-btn receipt">
                      Download Receipt
                    </button>
                  </div>

                  <div className="purchase-meta">
                    <p>Purchased: {property.soldAt ? new Date(property.soldAt).toLocaleDateString() : 'Date not available'}</p>
                    <p>Property ID: {property.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MyPurchases;
