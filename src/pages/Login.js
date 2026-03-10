import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { auth } from '../context/firebase';
import { apiGetUserProfile } from '../api';
import './Login.css';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from 'react-icons/fa';
import ThreeBackground from '../ThreeBackground';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const authInstance = getAuth();

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
        setIsLoading(true);
        setError(null);
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
        <div className="min-h-screen bg-bg relative flex items-center justify-center px-4">
            <ThreeBackground />

            <div className="w-full max-w-md z-10 animate-fade-in">
                <div className="glass p-10 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-3xl">
                    <div className="mb-10 text-center">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Welcome Back</h2>
                        <p className="text-dim text-sm font-medium">Log in to your MetaHive account</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3 animate-slide-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-dim uppercase tracking-widest ml-4">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-dim group-focus-within:text-white transition-colors">
                                    <FaEnvelope size={14} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-dim uppercase tracking-widest ml-4">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-dim group-focus-within:text-white transition-colors">
                                    <FaLock size={14} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-dim hover:text-white transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pr-2">
                            <Link to="/forgot-password" title="Under construction" className="text-[12px] font-bold text-dim hover:text-white transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-dark font-black py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    Log In
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center space-y-4">
                        <p className="text-sm text-dim font-medium">Don't have an account?</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/register/builder"
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                Builder Signup
                            </Link>
                            <Link
                                to="/register/buyer"
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                Buyer Signup
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
