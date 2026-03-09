import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
            await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Fast verify MongoDB existence
            try {
                await apiGetUserProfile();
                // Successfully logged in and verified in DB
                navigate('/');
            } catch (apiError) {
                // Firebase auth worked, but MongoDB has no record of this user.
                await signOut(auth);
                setError('Registration incomplete! Please register your profile below.');
                console.error('Login error (API sync):', apiError);
                return;
            }

        } catch (err) {
            setError(err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' ? 'Invalid email or password' : 'Login Failed.');
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
                        {error && <div className="error-message">{error}</div>}
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
