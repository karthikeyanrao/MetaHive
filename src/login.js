import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './context/firebase';
import { apiGetUserProfile } from './api';
import './login.css';

const LEFT_IMAGE = 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1000&q=80';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            try {
                await apiGetUserProfile();
                navigate('/');
            } catch (apiError) {
                localStorage.setItem('pendingRegEmail', formData.email);
                setError('Profile not found. Please complete your registration.');
            }
        } catch (err) {
            setError('Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-image-wrap">
                    <img src={LEFT_IMAGE} alt="Dark modern architecture" />
                    <div className="auth-quote">
                        "The future of real estate<br />is on the blockchain."
                        <span>— MetaHive Platform</span>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-container">
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>EMAIL</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>PASSWORD</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-submit" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-bottom-links">
                        Don't have an account? <Link to="/register/buyer">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
