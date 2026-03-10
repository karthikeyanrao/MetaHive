import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { apiGetBuilderProperties, apiDeleteProperty } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import './BuilderDashboard.css';
import ThreeBackground from '../ThreeBackground';

function ListedProperties() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, sold

  const isBuilder = userRole === 'Builder' || userRole === 'builder';

  useEffect(() => {
    if (isBuilder && currentUser?.uid) {
      fetchListedProperties();
    } else {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  const fetchListedProperties = async () => {
    try {
      const docs = await apiGetBuilderProperties();
      const propertiesData = docs.map((doc) => {
        // Extract first real image URL from flat or nested schema
        const rawImages = (() => {
          const raw = doc.propertyDetails?.images || doc.images || [];
          if (Array.isArray(raw)) return raw.filter(url => typeof url === 'string' && url.startsWith('http'));
          if (typeof raw === 'string' && raw.startsWith('http')) return [raw];
          return [];
        })();

        return {
          id: doc._id,
          isSold: (doc.status || '').toLowerCase() === 'sold' || (doc.isSold || '').toLowerCase() === 'yes' || (doc.isSold || '').toLowerCase() === 'sold' ? 'Sold' : 'New',
          title: doc.propertyDetails?.title || doc.title || 'Untitled Property',
          price: doc.propertyDetails?.price || doc.price || 0,
          location: doc.propertyDetails?.address || doc.location || doc.address || 'Unknown Location',
          bedrooms: doc.propertyDetails?.bedrooms || doc.bedrooms || 0,
          bathrooms: doc.propertyDetails?.bathrooms || doc.bathrooms || 0,
          area: doc.propertyDetails?.area || doc.area || 0,
          NftMinted: doc.NftMinted || doc.propertyDetails?.NftMinted || 'No',
          builderId: doc.builderId,
          description: doc.propertyDetails?.description || doc.description || doc.buildingDescription || 'No description',
          createdAt: doc.createdAt,
          thumbnail: rawImages.length > 0 ? rawImages[0] : null
        };
      });
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching listed properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        console.log('[ListedProperties] Deleting property:', propertyId);
        await apiDeleteProperty(propertyId);
        console.log('[ListedProperties] Delete API success');
        setProperties(properties.filter(prop => prop.id !== propertyId));
        alert('Property deleted successfully!');
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error deleting property. Please try again.');
      }
    }
  };

  const filteredProperties = properties.filter(property => {
    if (filter === 'all') return true;
    if (filter === 'new') return property.isSold === 'New';
    if (filter === 'sold') return property.isSold === 'Sold';
    return true;
  });

  if (loading) {
    return (
      <>
        <ThreeBackground />
        <div className="listed-properties-container">
          <div className="loading">Loading your properties...</div>
        </div>
      </>
    );
  }

  if (!isBuilder) {
    return (
      <>
        <ThreeBackground />
        <div className="listed-properties-container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only builders can view their listed properties.</p>
            <Link to="/" className="home-link">Go Home</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThreeBackground />
      <div className="listed-properties-container">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>

        <div className="page-header">
          <h1>My Listed Properties</h1>
          <Link to="/add-property" className="add-property-btn">
            Add New Property
          </Link>
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Properties ({properties.length})
          </button>
          <button
            className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
            onClick={() => setFilter('new')}
          >
            Available ({properties.filter(p => p.isSold === 'New').length})
          </button>
          <button
            className={`filter-btn ${filter === 'sold' ? 'active' : ''}`}
            onClick={() => setFilter('sold')}
          >
            Sold ({properties.filter(p => p.isSold === 'Sold').length})
          </button>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="no-properties">
            <h3>No properties found</h3>
            <p>
              {filter === 'all'
                ? "You haven't listed any properties yet."
                : `No ${filter} properties found.`
              }
            </p>
            {filter === 'all' && (
              <Link to="/add-property" className="add-first-property-btn">
                List Your First Property
              </Link>
            )}
          </div>
        ) : (
          <div className="properties-grid">
            {filteredProperties.map((property) => (
              <div key={property.id} className={`property-card ${property.isSold === 'Sold' ? 'sold' : ''}`}>
                <div className="property-status">
                  <span className={`status-badge ${property.isSold.toLowerCase()}`}>
                    {property.isSold}
                  </span>
                </div>

                <Link to={`/property/${property.id}`} className="property-link">
                  <div className="property-image">
                    <img
                      src={property.thumbnail || '/home.png'}
                      alt={property.title}
                      onError={(e) => { e.target.src = '/home.png'; }}
                    />
                  </div>
                  <div className="property-info">
                    <h3>{property.title}</h3>
                    <p className="price">${property.price?.toLocaleString()}</p>
                    <p className="location">{property.location}</p>
                    <p className="details">
                      {property.bedrooms} beds • {property.bathrooms} baths • {property.area} sqft
                    </p>
                    <p className="description">{property.description}</p>
                  </div>
                </Link>

                <div className="property-actions">
                  <Link to={`/property/${property.id}`} className="action-btn view">
                    View Details
                  </Link>
                  {property.isSold === 'New' && property.builderId === currentUser?.uid && (
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="property-meta">
                  <p>Listed: {new Date(property.createdAt).toLocaleDateString()}</p>
                  <p>Builder: {property.builderName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ListedProperties;
