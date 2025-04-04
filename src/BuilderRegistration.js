import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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
    aadharNo: ''
  });

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const db = getFirestore();

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Step 2: Save user details in Firestore under Users collection
      const userData = {
        name: formData.name,
        companyName: formData.companyName,
        licenseNumber: formData.licenseNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        aadharNo: formData.aadharNo,
        role: 'Builder',
        registrationDate: new Date().toISOString(),
        userId: user.uid,
        licenseImage: localStorage.getItem('licenseImage') // Store license image path
      };

      // Save to Firestore in Users collection
      await setDoc(doc(db, "Users", user.uid), userData);

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

  // New function to handle license image upload
  const handleLicenseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('licenseImage', reader.result); // Store image in local storage
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