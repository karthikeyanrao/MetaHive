import React, { useState, useContext, useEffect } from 'react';
import './AddProperty.css';
import ThreeBackground from './ThreeBackground';
import { db } from './context/firebase';    
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

function AddProperty() {
  const navigate = useNavigate();
  const { user, currentUser } = useAuth();

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
    const fetchUserName = async () => {
      if (user && user.email) {
        try {
          const userDoc = await getDoc(doc(db, 'Users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData(prevData => ({
              ...prevData,
              name: userData.name || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserName();
  }, [user]);

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    const uniqueId = uuidv4();

    if (!formData.title || !formData.price || !formData.streetNumber || !formData.completeAddress) {
      alert("Please fill in all required fields (Title, Price, Street Number, and Complete Address)");
      return;
    }

    if (selectedFiles.length > 0) {
      try {
        selectedFiles.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem(`propertyImage_${uniqueId}_${file.name}`, reader.result);
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error('Error storing images:', error);
      }
    }

    handleSubmit(uniqueId);
  };

  const handleSubmit = async (uniqueId) => {
    setIsLoading(true);

    try {
      // Enhanced geocoding for global locations
      const locationQuery = encodeURIComponent(formData.completeAddress);
      
      // Use multiple geocoding strategies for better global coverage
      const geocodingPromises = [
        // Primary: OpenStreetMap Nominatim (global coverage)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&limit=1&addressdetails=1&extratags=1&namedetails=1&countrycodes=&accept-language=en`),
        
        // Fallback: Try with different parameters for better international results
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&limit=1&addressdetails=1&extratags=1&namedetails=1&countrycodes=&accept-language=en&dedupe=0`)
      ];
      
      let data = [];
      let response;
      
      // Try primary geocoding first
      try {
        response = await geocodingPromises[0];
        data = await response.json();
      } catch (error) {
        console.log('Primary geocoding failed, trying fallback...');
        response = await geocodingPromises[1];
        data = await response.json();
      }
   
      if (data.length === 0) {
        alert("Location not found. Please verify the address details. Make sure to include country name for international addresses.");
        setIsLoading(false);
        return;
      }
   
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const displayName = data[0].display_name;
      const country = data[0].address?.country || 'Unknown';
      const countryCode = data[0].address?.country_code || 'XX';
   
      const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
         
        const propertyData = {
          id: uniqueId,
          title: formData.title,
          price: Number(formData.price),
          streetNumber: formData.streetNumber,
          location: formData.completeAddress,
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          area: Number(formData.area),
          description: formData.description,
          NftMinted: formData.NftMinted,
          lat: lat,
          lng: lng,
          displayName: displayName,
          country: country,
          countryCode: countryCode,
          createdAt: new Date().toISOString(),
          builderId: currentUser.uid,
          builderName: userData.name,
          builderEmail: currentUser.email,
          builderPhone: userData.phone || 'Not available',
          isSold: "New",
          rawMaterials: formData.rawMaterials,
          buildingDescription: formData.buildingDescription,
          details: formData.details,
          furnishedStatus: formData.furnishedStatus,
          amenities: formData.amenities
        };
         
        await addDoc(collection(db, 'properties'), propertyData);
        localStorage.setItem('propertyId', uniqueId);
        
        alert('Property listed successfully! Redirecting to properties page...');
        
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
          navigate('/properties');
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
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
              <strong>Examples:</strong><br/>
              🇺🇸 123 Main Street, New York, NY 10001, United States<br/>
              🇬🇧 10 Downing Street, Westminster, London SW1A 2AA, United Kingdom<br/>
              🇫🇷 1 Avenue des Champs-Élysées, 75008 Paris, France<br/>
              🇯🇵 1-1-1 Shibuya, Shibuya City, Tokyo 150-0002, Japan<br/>
              🇦🇺 1 Collins Street, Melbourne VIC 3000, Australia<br/>
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
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            onClick={handleUpload}
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