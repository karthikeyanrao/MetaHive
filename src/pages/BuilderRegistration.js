import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../context/firebase";
import { apiCreateUserProfile } from '../api';
import '../login.css';
import { Link, useNavigate } from 'react-router-dom';

const LEFT_IMAGE = 'https://images.unsplash.com/photo-1541888044738-f9964522a4bb?w=1000&q=80';

function BuilderRegistration() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    registrationNumber: '', licenseNumber: '',
    gstin: '', password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      await apiCreateUserProfile({
        ...formData,
        registrationDate: new Date().toISOString(),
        userId: userCredential.user.uid,
        role: 'Builder',
        status: 'pending'
      });

      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-image-wrap">
          <img src={LEFT_IMAGE} alt="Construction Architecture" />
          <div className="auth-quote">
            "Build the foundations of decentralized living."
            <span>— MetaHive Builders</span>
          </div>
        </div>
      </div>

      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div className="auth-form-container" style={{ margin: 'auto 0' }}>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join the decentralized real estate platform</p>

          <div className="auth-role-selector">
            <Link to="/register/buyer" className="role-card">
              <span>Buyer</span>
              <small>+250 TO HOST & BUY properties</small>
            </Link>
            <div className="role-card active">
              <span>Builder</span>
              <small>+500 TO LIST properties</small>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>COMPANY / BUILDER NAME</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>EMAIL</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>PHONE</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>REGISTERED OFFICE ADDRESS</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
            </div>

            <div className="auth-form-row">
              <div className="form-group">
                <label>RERA REGISTRATION</label>
                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>LICENSE NUMBER</label>
                <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>GSTIN</label>
              <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-bottom-links">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuilderRegistration;