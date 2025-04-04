import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./context/firebase"; // Include initialized Firestore instance
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import './BuyerRegistration.css';
import ThreeBackground from './ThreeBackground';

function BuyerRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    aadharId: '',
    aadharProof: null,
    email: '',
    phone: '',
    address: '',
    password: '',
    annualIncome: '',
    panNumber: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [aadharProofBase64, setAadharProofBase64] = useState(null); // State to hold Base64 image

  useEffect(() => {
    // Retrieve the Base64 string from local storage when the component mounts
    const storedAadharProof = localStorage.getItem('aadharProof');
    if (storedAadharProof) {
      setAadharProofBase64(storedAadharProof);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload a JPG, PNG, or PDF.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5 MB limit
        setError("File size exceeds 5 MB. Please compress the image and try again.");
        return;
      }

      // Convert file to Base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAadharProofBase64(base64String);
        localStorage.setItem('aadharProof', base64String); // Store in local storage
      };
      reader.readAsDataURL(file); // Read file as Data URL
      setFormData(prevState => ({
        ...prevState,
        aadharProof: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Scroll to the top of the page
    window.scrollTo(0, 0);

    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Step 2: Save additional details in Firestore under Users collection
      const buyerData = {
        name: formData.name,
        aadharId: formData.aadharId,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        annualIncome: formData.annualIncome,
        panNumber: formData.panNumber,
        registrationDate: new Date().toISOString(),
        userId: user.uid,
        role: 'Buyer' // Set default role to Buyer
      };

      // Save to Firestore in Users collection
      await setDoc(doc(db, "Users", user.uid), buyerData);

      setSuccess(`Buyer registered successfully! Welcome, ${formData.name}`);
      setError(null);
      
      // Clear form after successful registration
      setFormData({
        name: '', 
        aadharId: '',
        aadharProof: null,
        email: '',
        phone: '',
        address: '',
        password: '',
        annualIncome: '',
        panNumber: ''
      });
      history.push('/');
    } catch (err) {
      setError(err.message);
      setSuccess(null);
      console.error("Error during registration:", err);
    }
  };

  return (  
    <div>
      <ThreeBackground />
      <div className="buyer-registration">
        <div className="registration-container">
          <h1>Buyer Registration</h1>
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
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Aadhar ID *</label>
                <input
                  type="text"
                  name="aadharId"
                  value={formData.aadharId}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your Aadhar number"
                  pattern="[0-9]{12}"
                  title="Please enter valid 12-digit Aadhar number"
                />
              </div>

              <div className="form-group">
                <label>PAN Number *</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter PAN number"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  title="Please enter valid PAN number"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Aadhar Card Proof </label>
              <input
                type="file"
                name="aadharProof"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input"
              />
              <small>Upload your Aadhar card (PDF, JPG, PNG)</small>
            </div>

          
            <div className="form-row">
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
                  pattern="[0-9]{10}"
                  title="Please enter valid 10-digit phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Residential Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter your complete residential address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div className="form-group">
                <label>Annual Income *</label>
                <input
                  type="number"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="Enter annual income"
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Register as Buyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BuyerRegistration;
