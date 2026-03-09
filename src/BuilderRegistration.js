import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './context/firebase';
import { apiCreateUserProfile } from './api';
import { uploadFileToIPFS } from './api/ipfs';
import './BuilderRegistration.css';
import ThreeBackground from './ThreeBackground';

function BuilderRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    licenseNumber: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    aadharNo: '',
    licenseImageFile: null
  });

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo(0, 0); // Scroll to the top of the window
    try {
      // Step 1: Create user in Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log("Firebase account already exists. Signing in to complete MongoDB registration...");
          const { signInWithEmailAndPassword } = require("firebase/auth");
          userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        } else {
          throw authErr;
        }
      }

      const user = userCredential.user;

      let licenseImageUrl = null;
      if (formData.licenseImageFile) {
        setSuccess("Uploading License Image to IPFS...");
        licenseImageUrl = await uploadFileToIPFS(formData.licenseImageFile);
      }

      // Step 2: Save user details using API
      const userData = {
        fullName: formData.name,
        companyName: formData.companyName,
        licenseNumber: formData.licenseNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        aadharNo: formData.aadharNo,
        userType: 'builder',
        licenseImage: licenseImageUrl
      };

      // Create through API
      await apiCreateUserProfile(userData);

      setSuccess(`User registered successfully! Welcome, ${formData.name}`);
      setError(null);

      // Clear form after successful registration
      setFormData({
        name: '',
        companyName: '',
        licenseNumber: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        aadharNo: ''
      });

      // Redirect to dashboard page
      window.location.href = '/dashboard'; // Redirect to dashboard

    } catch (err) {
      setError(err.message);
      setSuccess(null);
      console.error("Error during registration:", err);
    }
  };

  const handleLicenseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, licenseImageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('licenseImage', reader.result); // local preview
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <ThreeBackground />
      <div className="builder-registration">
        <div className="registration-container">
          <h1>Builder Registration</h1>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              <span role="img" aria-label="success">✅</span> {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Aadhar Number *</label>
              <input
                type="text"
                name="aadharNo"
                value={formData.aadharNo}
                onChange={handleInputChange}
                required
                placeholder="Enter your Aadhar number"
              />
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                placeholder="Enter company name"
              />
            </div>

            <div className="form-group">
              <label>License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter license number"
              />
            </div>
            <div className="form-group">
              <label>License Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseImageUpload}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>Office Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter complete office address"
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter password"
              />
            </div>



            <button type="submit" className="submit-button">
              Register as Builder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BuilderRegistration;