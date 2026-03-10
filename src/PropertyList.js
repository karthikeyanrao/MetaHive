import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetAllProperties } from './api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './pages/PropertyGrid.css';

import img1 from './img1.jpg';
import img2 from './img2.jpg';
import img3 from './img3.jpg';
import img4 from './img4.jpg';
import img6 from './img6.jpg';

const redMarker = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [showSoldProperties, setShowSoldProperties] = useState(false);
  const [visibleMap, setVisibleMap] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const apidocs = await apiGetAllProperties();
      const firestoreProperties = apidocs.map((doc) => {
        const pDetails = doc.propertyDetails || {};

        const rawImages = (() => {
          const raw = pDetails.images || doc.images || [];
          if (Array.isArray(raw)) return raw.filter(url => typeof url === 'string');
          if (typeof raw === 'string') return [raw];
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
          title: pDetails.title || doc.title || 'Untitled Property',
          location: pDetails.address || doc.location || doc.address || 'Unknown Location',
          price: pDetails.price || doc.price || 0,
          isSold: (doc.status || '').toLowerCase() === 'sold' || (doc.isSold || '').toLowerCase() === 'sold' || (doc.isSold || '').toLowerCase() === 'yes' ? 'Sold' : 'For Sale',
          randomImage: rawImages.length > 0 ? rawImages[0] : [img1, img2, img3, img4, img6][Math.floor(Math.random() * 5)],
          lat: latitude,
          lng: longitude
        };
      });
      setProperties(firestoreProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const filteredProperties = properties
    .filter((property) => {
      const isAvailable = showSoldProperties ? true : property.isSold !== 'Sold';
      const matchesSearch = (property.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      return isAvailable && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'Low') return a.price - b.price;
      if (sortOrder === 'High') return b.price - a.price;
      return 0;
    });

  return (
    <div className="pg-container">
      <div className="pg-header-row">
        <div className="pg-title-col">
          <p className="pg-subtitle">Portfolio</p>
          <h1 className="pg-title">All Properties</h1>
        </div>

        <div className="pg-filters-col">
          <input
            type="text"
            className="pg-search-input"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select className="pg-sort-select" onChange={(e) => setSortOrder(e.target.value)}>
            <option value="none">Sort by: Default</option>
            <option value="Low">Price: Low to High</option>
            <option value="High">Price: High to Low</option>
          </select>

          <button
            className={`pg-toggle-btn ${showSoldProperties ? 'active' : ''}`}
            onClick={() => setShowSoldProperties(!showSoldProperties)}
          >
            Show Sold
          </button>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="pg-no-results">No properties found. Try adjusting your search filters.</div>
      ) : (
        <div className="pg-grid">
          {filteredProperties.map((property) => (
            <div key={property.id} className="pg-card-wrap">
              <Link to={`/property/${property.id}`} className="pg-card">
                <div className="pg-card-img">
                  <img src={property.randomImage} alt={property.title} />
                </div>

                <div className="pg-card-body">
                  <div className="pg-card-row-top">
                    <h3 className="pg-card-title">{property.title}</h3>
                    <span className={`pg-card-status ${property.isSold === 'Sold' ? 'sold' : ''}`}>
                      {property.isSold.toUpperCase()}
                    </span>
                  </div>

                  <p className="pg-card-location">
                    <i className="fas fa-map-marker-alt"></i> {property.location}
                  </p>

                  <div className="pg-card-row-bottom">
                    <p className="pg-card-price">${Number(property.price).toLocaleString()}</p>
                    <div className="pg-card-actions">
                      <button
                        className={`pg-map-toggle ${visibleMap === property.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setVisibleMap(visibleMap === property.id ? null : property.id);
                        }}
                        title="View on Map"
                      >
                        <i className="fas fa-location-dot"></i>
                      </button>
                      <span className="pg-card-link">Details &rarr;</span>
                    </div>
                  </div>
                </div>
              </Link>

              {visibleMap === property.id && (
                <div className="pg-inline-map" onClick={(e) => e.stopPropagation()}>
                  <div className="pg-map-preview-header">
                    <span className="pg-map-preview-label">Location Preview</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pg-map-preview-link"
                    >
                      Open In Maps <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                  <div className="pg-map-preview-frame">
                    <MapContainer center={[property.lat, property.lng]} zoom={15} style={{ height: '220px', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[property.lat, property.lng]} icon={redMarker}>
                        <Popup>{property.title}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertyList;
