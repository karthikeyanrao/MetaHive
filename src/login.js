import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './context/firebase';
import { apiGetUserProfile } from './api';
import './login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ThreeBackground from './ThreeBackground';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Verify MongoDB profile exists
            try {
                await apiGetUserProfile();
                // Successfully logged in and profile verified — go home
                navigate('/');
            } catch (apiError) {
                // Firebase auth worked, but NO MongoDB profile found.
                // Don't lock them out — redirect to registration to complete their profile.
                console.warn('Login: Firebase user found but no DB profile. Redirecting to register.', apiError);
                // Store email hint so the registration form can prefill
                localStorage.setItem('pendingRegEmail', formData.email);
                setError('Your account is not fully set up. Please complete your registration below.');
                // Keep user signed in so the registration form can call the API with their token
            }

        } catch (err) {
            setError(err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Login Failed. Please try again.');
            console.error('Login error:', err);
        }
    };

    return (
        <div>
            <ThreeBackground />
            <div className="wrapper">
                <div className="form-wrapper sign-in">
                    <form onSubmit={handleSubmit}>
                        <h2>Login</h2>
                        {error && (
                            <div className="error-message">
                                {error}
                                {error.includes('not fully set up') && (
                                    <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                                        Complete as: &nbsp;
                                        <Link to="/register/buyer" style={{ color: '#4fc3f7', marginRight: '8px' }}>Buyer</Link> |&nbsp;
                                        <Link to="/register/builder" style={{ color: '#4fc3f7', marginLeft: '8px' }}>Builder</Link>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            <label>Email</label>
                        </div>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <label>Password</label>
                            <span
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        <div className="forgot-pass">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>
                        <button type="submit" className="btn">Login</button>
                        <div className="sign-link">
                            <p>Don't have an account?
                                <div className="register-dropdown">
                                    <button className="register-button" type="button">
                                        Register
                                        <div className="dropdown-menu">
                                            <Link to="/register/builder" className="dropdown-item">Builder</Link>
                                            <Link to="/register/buyer" className="dropdown-item">Buyer</Link>
                                        </div>
                                    </button>
                                </div>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
