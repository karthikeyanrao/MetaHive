import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiGetAllProperties } from '../api';
import 'leaflet/dist/leaflet.css';
import image1 from '../home.png';
import './PropertyGrid.css';
import ThreeBackground from '../ThreeBackground';

import img1 from '../img1.jpg';
import img2 from '../img2.jpg';
import img3 from '../img3.jpg';
import img4 from '../img4.jpg';
import img6 from '../img6.jpg';

// Red marker icon
const redMarker = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('none');
  const [visibleMap, setVisibleMap] = useState(null);
  const [showSoldProperties, setShowSoldProperties] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle scroll to show/hide filters
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsFiltersVisible(scrollTop < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProperties = async () => {
    try {
      const apidocs = await apiGetAllProperties();
      const firestoreProperties = apidocs.map((doc) => {
        const pDetails = doc.propertyDetails || {};

        // Parse location - could be flat string "lat,lng", an object {lat,lng}, or missing
        let latitude = 12.9716;
        let longitude = 77.5946;
        if (pDetails.location?.lat !== undefined) {
          latitude = pDetails.location.lat;
          longitude = pDetails.location.lng;
        } else if (typeof doc.location === 'string' && doc.location.includes(',')) {
          const parts = doc.location.split(',');
          latitude = parseFloat(parts[0]) || latitude;
          longitude = parseFloat(parts[1]) || longitude;
        } else if (typeof doc.location === 'object' && doc.location?.lat) {
          latitude = doc.location.lat;
          longitude = doc.location.lng;
        }

        // Real images: normalize from both flat and nested schemas
        const rawImages = (() => {
          const raw = pDetails.images || doc.images || [];
          if (Array.isArray(raw)) return raw.filter(url => typeof url === 'string' && url.startsWith('http'));
          if (typeof raw === 'string' && raw.startsWith('http')) return [raw];
          return [];
        })();

        return {
          id: doc._id,
          title: pDetails.title || doc.title || 'Untitled Property',
          location: pDetails.address || doc.location || doc.address || 'Unknown Location',
          price: pDetails.price || doc.price || 0,
          bedrooms: pDetails.bedrooms || doc.bedrooms || 0,
          bathrooms: pDetails.bathrooms || doc.bathrooms || 0,
          area: pDetails.area || doc.area || 0,
          isSold: (doc.status || '').toLowerCase() === 'sold' || (doc.isSold || '').toLowerCase() === 'sold' ? 'Sold' : 'New',
          lat: latitude,
          lng: longitude,
          images: rawImages.length > 0 ? rawImages : [img1, img2, img3, img4, img6],
          randomImage: rawImages.length > 0
            ? rawImages[0]
            : [img1, img2, img3, img4, img6][Math.floor(Math.random() * 5)],
        };
      });

      setProperties(firestoreProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const filteredProperties = properties
    .filter((property) => {
      // Show available properties or sold properties based on toggle
      const isAvailable = showSoldProperties ? true : property.isSold !== 'Sold';

      const matchesSearch =
        (property.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.location || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchesPrice = true;
      if (priceRange === 'low') {
        matchesPrice = property.price <= 200000;
      } else if (priceRange === 'mid') {
        matchesPrice = property.price > 200000 && property.price <= 500000;
      } else if (priceRange === 'high') {
        matchesPrice = property.price > 500000;
      }
      return isAvailable && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortOrder === 'Low') {
        return a.price - b.price;
      } else if (sortOrder === 'High') {
        return b.price - a.price;
      }
      return 0;
    });

  const toggleMap = (propertyId) => {
    setVisibleMap(visibleMap === propertyId ? null : propertyId);
  };

  return (
    <>
      <ThreeBackground />
      <div className="property-list">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>

        <div className={`filters ${isFiltersVisible ? 'filters-visible' : 'filters-hidden'}`}>
          <div className="filters-content">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select onChange={(e) => setPriceRange(e.target.value)}>
              <option value="all">Filter by Price</option>
              <option value="low">$0 - $200,000</option>
              <option value="mid">$200,000 - $500,000</option>
              <option value="high">$500,000+</option>
            </select>
            <select onChange={(e) => setSortOrder(e.target.value)}>
              <option value="none">Sort by Price</option>
              <option value="Low">Low to High</option>
              <option value="High">High to Low</option>
            </select>
            <button
              className={`toggle-sold-btn ${showSoldProperties ? 'active' : ''}`}
              onClick={() => setShowSoldProperties(!showSoldProperties)}
            >
              {showSoldProperties ? 'Hide Sold' : 'Show Sold'}
            </button>
          </div>
        </div>

        <div className="properties-info">
          <p>
            {showSoldProperties ? (
              <>
                Showing {filteredProperties.length} properties (including sold)
                {properties.length !== filteredProperties.length && (
                  <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                    ({properties.length - filteredProperties.length} properties filtered out)
                  </span>
                )}
              </>
            ) : (
              <>
                Showing {filteredProperties.length} available properties
                {properties.length > filteredProperties.length && (
                  <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                    ({properties.length - filteredProperties.length} sold properties hidden)
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className="properties-grid">
          {filteredProperties.length === 0 ? (
            <div className="no-properties" style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#00d4ff', marginBottom: '10px' }}>No Available Properties Found</h3>
              <p>All properties are currently sold or no properties match your search criteria.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: '0.8' }}>
                Try adjusting your search terms or price range.
              </p>
            </div>
          ) : (
            filteredProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className={`property-status-badge ${property.isSold === 'Sold' ? 'sold' : 'available'}`}>
                  {property.isSold === 'Sold' ? 'Sold' : 'Available'}
                </div>
                <Link to={`/property/${property.id}`} className="property-link">
                  <div className="property-image-container">
                    <img src={property.randomImage} alt={property.title} />
                  </div>
                  <div className="property-info">
                    <h3>{property.title}</h3>
                    <p className="price">${property.price.toLocaleString()}</p>
                    <p className="details">{property.bedrooms} beds • {property.bathrooms} baths • {property.area} sqft</p>
                  </div>
                </Link>
                <p className="location">
                  <span
                    className="location-marker"
                    onClick={() => toggleMap(property.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {property.location}
                  </span>
                </p>
                {visibleMap === property.id && (
                  <div className="mini-map" style={{ marginTop: '10px' }}>
                    <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'gold',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <i className="fas fa-map-marked-alt"></i> Open in Google Maps
                      </a>
                    </div>
                    <MapContainer center={[property.lat, property.lng]} zoom={15} style={{ height: '200px', width: '100%', borderRadius: '8px' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[property.lat, property.lng]} icon={redMarker}>
                        <Popup>
                          {property.title} - {property.location}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default PropertyList;
