import React, { useState, useContext, useEffect } from 'react';
import './AddProperty.css';
import ThreeBackground from './ThreeBackground';
import { db } from './context/firebase';    
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique IDs


function AddProperty() {
  const navigate = useNavigate();
  
  const { user, currentUser } = useAuth(); // Get user details from the useAuth hook

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
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
          const userDoc = await getDoc(doc(db, 'Users', user.email)); // Fetch user data from Users collection
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData((prevData) => ({
              ...prevData,
              name: userData.name || '' // Set the name from the user document
            }));
          } else {
            console.error('User not found in Users collection');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserName(); // Call the function to fetch user name
  }, [user, db]);

  useEffect(() => {
    if (currentUser) {
          // Also fetch and log the complete user data from Firestore
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
          if (userDoc.exists()) {
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      
      fetchUserData();
    }
  }, [currentUser]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const fileReaders = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Create an image element to draw the image
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 800; // Set max width
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress to JPEG with 70% quality

            // Store compressed image in local storage
            localStorage.setItem(`${uniqueId}_${file.name}`, compressedDataUrl);
            resolve();
          };
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then(() => {
      setSelectedFiles(files);
    });
  };

  const handleUpload = async () => {
    // Generate a unique ID for the building
    const uniqueId = uuidv4();

    // Validate required fields before proceeding
    if (!formData.title || !formData.price || !formData.location) {
      alert("Please fill in all required fields");
      return;
    }

    if (selectedFiles.length > 0) {
      try {
        // Store images in local storage with the unique ID as the key
        selectedFiles.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem(`${uniqueId}_${file.name}`, reader.result);
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error("Error handling files:", error);
        alert("Error handling files: " + error.message);
        return; // Return early if there's an error with files
      }
    }
    
    // Scroll to the top of the page
    window.scrollTo(0, 0);
    
    try {
      // Call handleSubmit with the unique ID
      await handleSubmit(uniqueId);
    } catch (error) {
      alert("Error submitting form: " + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAmenityChange = (event) => {
    const { name, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      amenities: {
        ...prevData.amenities,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (uniqueId) => {
    setIsLoading(true);

    try {
       // 🔹 Fetch latitude and longitude using OpenStreetMap API
       const locationQuery = encodeURIComponent(formData.location);
       const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&limit=1`);
       const data = await response.json();
   
       if (data.length === 0) {
         alert("Location not found. Please enter a valid address.");
         setIsLoading(false);
         return;
       }
   
       // Define lat & lng before using them
       const lat = parseFloat(data[0].lat);
       const lng = parseFloat(data[0].lon);
   
   
       // 🔹 Fetch user data using currentUser.uid
       const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
       if (userDoc.exists()) {
         const userData = userDoc.data();
         
         // 🔹 Prepare property data with lat/lng and unique ID
         const propertyData = {
           id: uniqueId, // Store the unique ID
           title: formData.title,
           price: Number(formData.price),
           location: formData.location,
           bedrooms: Number(formData.bedrooms),
           bathrooms: Number(formData.bathrooms),
           area: Number(formData.area),
           description: formData.description,
           NftMinted: formData.NftMinted,
           lat: lat, // ✅ Ensure lat is defined
           lng: lng, // ✅ Ensure lng is defined
           createdAt: new Date().toISOString(),
           builderId: currentUser.uid,
           builderName: userData.name,
           builderEmail: currentUser.email,
           isSold: "New",
           rawMaterials: formData.rawMaterials,
           buildingDescription: formData.buildingDescription,
           details: formData.details,
           furnishedStatus: formData.furnishedStatus,
           amenities: formData.amenities
         };
         
         
         // Add to Firestore
         const docRef = await addDoc(collection(db, 'properties'), propertyData);
         
         // Store the unique ID in local storage
         localStorage.setItem('propertyId', uniqueId);
         
         alert('Property listed successfully! Redirecting to properties page...');
         
         // Clear form
         setFormData({
           title: '',
           price: '',
           location: '',
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
         
         // Redirect to properties page
         setTimeout(() => {
           navigate('/properties');
         }, 500);
       }
    } catch (error) {
      console.error('Error details:', error);
      alert('Error adding property: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <ThreeBackground />
      <div className="add-property">
        {/* Back Button */}
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
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="area">Area (sq ft)</label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Enter area"
                required
              />
            </div>
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
                placeholder="No. of bedrooms"
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
                placeholder="No. of bathrooms"
                required
              />
            </div>
          </div>
          <div className="form-row">
  <div className="form-group">
    <label htmlFor="rawMaterials">Raw Materials Used</label>
    <textarea
      id="rawMaterials"
      name="rawMaterials"
      value={formData.rawMaterials}
      onChange={handleChange}
      placeholder="Enter raw materials used"
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
      placeholder="Enter building description"
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
        required
      />
      Furnished
    </label>
    <label>
      <input
        type="radio"
        name="furnishedStatus"
        value="Semi-Furnished"
        checked={formData.furnishedStatus === 'Semi-Furnished'}
        onChange={handleChange}
        required
      />
      Semi-Furnished
    </label>
    <label>
      <input
        type="radio"
        name="furnishedStatus"
        value="Non-Furnished"
        checked={formData.furnishedStatus === 'Non-Furnished'}
        onChange={handleChange}
        required
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