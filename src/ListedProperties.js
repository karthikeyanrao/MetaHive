import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { apiGetBuilderProperties, apiDeleteProperty } from './api';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ListedProperties.css';
import ThreeBackground from './ThreeBackground';

const redMarker = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

function ListedProperties() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, sold
  const [visibleMap, setVisibleMap] = useState(null);

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
        const pDetails = doc.propertyDetails || {};
        const rawImages = (() => {
          const raw = pDetails.images || doc.images || [];
          if (Array.isArray(raw)) return raw.filter(url => typeof url === 'string' && url.startsWith('http'));
          if (typeof raw === 'string' && raw.startsWith('http')) return [raw];
          return [];
        })();

        // ROBUST COORDINATE PARSING
        let latitude = 12.9716;
        let longitude = 77.5946;
        if (pDetails.location?.lat !== undefined) {
          latitude = Number(pDetails.location.lat);
          longitude = Number(pDetails.location.lng);
        } else if (typeof doc.location === 'string' && doc.location.includes(',')) {
          const parts = doc.location.split(',');
          latitude = parseFloat(parts[0]) || latitude;
          longitude = parseFloat(parts[1]) || longitude;
        } else if (typeof doc.location === 'object' && doc.location?.lat) {
          latitude = Number(doc.location.lat);
          longitude = Number(doc.location.lng);
        } else if (doc.lat !== undefined) {
          latitude = Number(doc.lat);
          longitude = Number(doc.lng || doc.longitude);
        }

        return {
          id: doc._id,
          isSold: (doc.status || '').toLowerCase() === 'sold' || (doc.isSold || '').toLowerCase() === 'yes' || (doc.isSold || '').toLowerCase() === 'sold' ? 'Sold' : 'New',
          title: pDetails.title || doc.title || 'Untitled Property',
          price: pDetails.price || doc.price || 0,
          location: pDetails.address || doc.location || doc.address || 'Unknown Location',
          bedrooms: pDetails.bedrooms || doc.bedrooms || 0,
          bathrooms: pDetails.bathrooms || doc.bathrooms || 0,
          area: pDetails.area || doc.area || 0,
          NftMinted: doc.NftMinted || pDetails.NftMinted || 'No',
          builderId: doc.builderId,
          description: pDetails.description || doc.description || doc.buildingDescription || 'No description',
          createdAt: doc.createdAt,
          thumbnail: rawImages.length > 0 ? rawImages[0] : null,
          lat: latitude,
          lng: longitude
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
        await apiDeleteProperty(propertyId);
        setProperties(properties.filter(prop => prop.id !== propertyId));
        alert('Property deleted successfully!');
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error deleting property.');
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
      <div className="listed-properties-container">
        <div className="access-denied">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="listed-properties-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        Back to Dashboard
      </button>

      <div className="page-header">
        <h1>My Listed Properties</h1>
        <Link to="/add-property" className="add-property-btn">
          Add New Property
        </Link>
      </div>

      <div className="filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({properties.length})</button>
        <button className={`filter-btn ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>Available ({properties.filter(p => p.isSold === 'New').length})</button>
        <button className={`filter-btn ${filter === 'sold' ? 'active' : ''}`} onClick={() => setFilter('sold')}>Sold ({properties.filter(p => p.isSold === 'Sold').length})</button>
      </div>

      <div className="properties-grid">
        {filteredProperties.map((property) => (
          <div key={property.id} className="property-card-wrapper">
            <div className="property-card">
              <Link to={`/property/${property.id}`} className="property-link">
                <div className="property-image">
                  <img src={property.thumbnail || '/home.png'} alt={property.title} />
                </div>
                <div className="property-info">
                  <h3>{property.title}</h3>
                  <p className="price">${property.price?.toLocaleString()}</p>
                  <p className="location">{property.location}</p>
                </div>
              </Link>
              <div className="property-actions" style={{ display: 'flex', gap: '8px', padding: '15px' }}>
                <Link to={`/property/${property.id}`} className="action-btn view" style={{ textDecoration: 'none', background: '#222', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', flex: 1, textAlign: 'center' }}>Details</Link>
                <button
                  onClick={() => setVisibleMap(visibleMap === property.id ? null : property.id)}
                  style={{ background: '#fff', color: '#000', border: '1px solid #000', borderRadius: '4px', padding: '10px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
                > MAP </button>
                {property.isSold === 'New' && (
                  <button onClick={() => handleDeleteProperty(property.id)} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px', flex: 1 }}>Delete</button>
                )}
              </div>
            </div>

            {visibleMap === property.id && (
              <div className="mini-map-inline" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '12px' }}>
                <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'gold', textDecoration: 'none', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fas fa-map-marked-alt"></i> Google Maps
                  </a>
                </div>
                <MapContainer center={[property.lat, property.lng]} zoom={15} style={{ height: '220px', width: '100%', borderRadius: '8px' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[property.lat, property.lng]} icon={redMarker}>
                    <Popup>{property.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListedProperties;
