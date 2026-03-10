import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../context/firebase";
import { apiCreateUserProfile } from '../api';
import '../login.css';
import { Link, useNavigate } from 'react-router-dom';

const LEFT_IMAGE = 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1000&q=80';

function BuyerRegistration() {
    const [formData, setFormData] = useState({
        name: '', aadharId: '', email: '', phone: '', address: '', password: '', annualIncome: '', panNumber: ''
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
                role: 'Buyer'
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
                    <img src={LEFT_IMAGE} alt="MetaHive Architecture" />
                    <div className="auth-quote">
                        "The future of real estate is on the blockchain."
                        <span>— MetaHive Platform</span>
                    </div>
                </div>
            </div>

            <div className="auth-right" style={{ overflowY: 'auto' }}>
                <div className="auth-form-container" style={{ margin: 'auto 0' }}>
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-subtitle">Join the decentralized real estate platform</p>

                    <div className="auth-role-selector">
                        <div className="role-card active">
                            <span>Buyer</span>
                            <small>+250 TO HOST & BUY properties</small>
                        </div>
                        <Link to="/register/builder" className="role-card">
                            <span>Builder</span>
                            <small>+500 TO LIST properties</small>
                        </Link>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>FULL NAME</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>

                        <div className="form-group">
                            <label>EMAIL</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>

                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>PHONE</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>AADHAR ID</label>
                                <input type="text" name="aadharId" value={formData.aadharId} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>RESIDENTIAL ADDRESS</label>
                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
                        </div>

                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>PAN NUMBER</label>
                                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>ANNUAL INCOME ($)</label>
                                <input type="number" name="annualIncome" value={formData.annualIncome} onChange={handleInputChange} required />
                            </div>
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

export default BuyerRegistration;
