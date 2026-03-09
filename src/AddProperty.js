import React, { useState, useContext, useEffect } from 'react';
import './AddProperty.css';
import ThreeBackground from './ThreeBackground';

import { uploadFileToIPFS } from './api/ipfs';
import { apiCreateProperty } from './api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

function AddProperty() {
  const navigate = useNavigate();
  const { currentUser, dbUser, userRole } = useAuth();

  // Role guard - only builders can add properties
  useEffect(() => {
    if (userRole && userRole !== 'Builder' && userRole !== 'builder') {
      alert('Only builders can add properties.');
      navigate('/');
    }
  }, [userRole, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    streetNumber: '',
    completeAddress: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    NftMinted: 'No',
    name: '',
    rawMaterials: '',
    buildingDescription: '',
    details: '',
    furnishedStatus: 'Non-Furnished',
    amenities: {
      carParking: false,
      swimmingPool: false,
      security: false,
      cctv: false,
    }
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (dbUser) {
      setFormData(prevData => ({
        ...prevData,
        name: dbUser.fullName || dbUser.name || currentUser?.displayName || ''
      }));
    }
  }, [dbUser, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAmenityChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      amenities: {
        ...prevData.amenities,
        [name]: checked
      }
    }));
  };

  const MAX_IMAGES = 5;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images. Only the first ${MAX_IMAGES} will be used.`);
      setSelectedFiles(files.slice(0, MAX_IMAGES));
    } else {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    setIsLoading(true);

    if (!formData.title || !formData.price || !formData.streetNumber || !formData.completeAddress) {
      alert("Please fill in all required fields (Title, Price, Street Number, and Complete Address)");
      setIsLoading(false);
      return;
    }

    let ipfsUrls = [];

    if (selectedFiles.length > 0) {
      try {
        const uploadPromises = selectedFiles.map(file => uploadFileToIPFS(file));
        ipfsUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Error uploading images to IPFS:', error);
        alert("Failed to upload images. Check IPFS connection or file sizes.");
        setIsLoading(false);
        return;
      }
    }

    handleSubmit(ipfsUrls);
  };

  const handleSubmit = async (ipfsUrls) => {
    setIsLoading(true);

    try {
      // Try geocoding but DON'T fail the whole form if it returns nothing
      let lat = 12.9716;   // Default: Bangalore, India
      let lng = 77.5946;

      try {
        const locationQuery = encodeURIComponent(formData.completeAddress);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&limit=1&accept-language=en`
        );
        const data = await response.json();
        if (data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          console.warn('Geocoding returned 0 results for:', formData.completeAddress, '- using default coordinates');
        }
      } catch (geoErr) {
        console.warn('Geocoding failed, using default coords:', geoErr.message);
      }

      await apiCreateProperty({
        // Flat root fields - matching Firestore/MongoDB schema
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        address: formData.completeAddress,
        location: `${lat},${lng}`,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        rawMaterials: formData.rawMaterials,
        buildingDescription: formData.buildingDescription,
        details: formData.details,
        furnishedStatus: formData.furnishedStatus,
        amenities: Object.keys(formData.amenities).filter(k => formData.amenities[k]),
        images: ipfsUrls,
        NftMinted: 'No',
        builderName: dbUser?.fullName || dbUser?.builderName || dbUser?.name || currentUser?.displayName || '',
        builderEmail: currentUser?.email || '',
        status: 'listed'
      });

      alert('Property listed successfully! Redirecting to your listed properties...');

      setFormData({
        title: '',
        price: '',
        streetNumber: '',
        completeAddress: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        description: '',
        NftMinted: 'No',
        name: '',
        rawMaterials: '',
        buildingDescription: '',
        details: '',
        furnishedStatus: 'Non-Furnished',
        amenities: {
          carParking: false,
          swimmingPool: false,
          security: false,
          cctv: false,
        }
      });
      setSelectedFiles([]);

      setTimeout(() => {
        navigate('/listed-properties');
      }, 1500);
    } catch (error) {
      console.error('Error adding property:', error);
      // Show the actual server error message
      const msg = error?.message || 'Unknown error';
      alert(`Failed to add property: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThreeBackground />
      <div className="add-property">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>
        <h2>List Your Property</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
          className="property-form"
        >
          <div className="form-group">
            <label htmlFor="title">Property Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter property title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="streetNumber">Street Number *</label>
              <input
                type="text"
                id="streetNumber"
                name="streetNumber"
                value={formData.streetNumber}
                onChange={handleChange}
                placeholder="e.g., 123, 45A, Block B"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="completeAddress">Complete Property Address *</label>
            <textarea
              id="completeAddress"
              name="completeAddress"
              value={formData.completeAddress}
              onChange={handleChange}
              placeholder="Enter the complete address of the property (anywhere in the world)"
              rows="3"
              required
            />
            <small style={{ color: '#888', fontSize: '12px' }}>
              <strong>Examples:</strong><br />
              🇺🇸 123 Main Street, New York, NY 10001, United States<br />
              🇬🇧 10 Downing Street, Westminster, London SW1A 2AA, United Kingdom<br />
              🇫🇷 1 Avenue des Champs-Élysées, 75008 Paris, France<br />
              🇯🇵 1-1-1 Shibuya, Shibuya City, Tokyo 150-0002, Japan<br />
              🇦🇺 1 Collins Street, Melbourne VIC 3000, Australia<br />
              <em>Include country name for best results!</em>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="area">Area (sq ft)</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Enter area in square feet"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="Number of bedrooms"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bathrooms">Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="Number of bathrooms"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your property"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rawMaterials">Raw Materials Used</label>
            <textarea
              id="rawMaterials"
              name="rawMaterials"
              value={formData.rawMaterials}
              onChange={handleChange}
              placeholder="List the raw materials used in construction"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="buildingDescription">Building Description</label>
            <textarea
              id="buildingDescription"
              name="buildingDescription"
              value={formData.buildingDescription}
              onChange={handleChange}
              placeholder="Describe the building structure and features"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="details">Details (e.g., number of fans, lights)</label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              placeholder="Enter details about fans, lights, etc."
              required
            />
          </div>

          <div className="form-group">
            <label>Furnished Status</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label>
                <input
                  type="radio"
                  name="furnishedStatus"
                  value="Furnished"
                  checked={formData.furnishedStatus === 'Furnished'}
                  onChange={handleChange}
                />
                Furnished
              </label>
              <label>
                <input
                  type="radio"
                  name="furnishedStatus"
                  value="Non-Furnished"
                  checked={formData.furnishedStatus === 'Non-Furnished'}
                  onChange={handleChange}
                />
                Non-Furnished
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Amenities</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label>
                <input
                  type="checkbox"
                  name="carParking"
                  checked={formData.amenities.carParking}
                  onChange={handleAmenityChange}
                />
                Car Parking
              </label>
              <label>
                <input
                  type="checkbox"
                  name="swimmingPool"
                  checked={formData.amenities.swimmingPool}
                  onChange={handleAmenityChange}
                />
                Swimming Pool
              </label>
              <label>
                <input
                  type="checkbox"
                  name="security"
                  checked={formData.amenities.security}
                  onChange={handleAmenityChange}
                />
                Security
              </label>
              <label>
                <input
                  type="checkbox"
                  name="cctv"
                  checked={formData.amenities.cctv}
                  onChange={handleAmenityChange}
                />
                CCTV
              </label>
            </div>
          </div>


          <div className="form-group">
            <label htmlFor="images">Property Images</label>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Add Property'}
          </button>
        </form>
      </div>
    </>
  );
}

export default AddProperty;