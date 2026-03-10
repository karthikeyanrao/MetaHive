import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
    return (
        <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="glass p-10 rounded-2xl max-w-2xl w-full text-center">
                <h1 className="text-4xl font-bold mb-8">Join MetaHive</h1>
                <p className="text-dim mb-10 text-lg">Choose your journey in the future of real estate.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link to="/register/builder" className="group">
                        <div className="p-8 border border-glass rounded-xl hover:border-primary transition-all bg-bg-glass hover:bg-primary/10">
                            <div className="text-5xl mb-4">🏗️</div>
                            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Builder</h3>
                            <p className="text-sm text-dim">List properties, mint NFTs, and manage your real estate portfolio.</p>
                        </div>
                    </Link>
                    <Link to="/register/buyer" className="group">
                        <div className="p-8 border border-glass rounded-xl hover:border-primary transition-all bg-bg-glass hover:bg-primary/10">
                            <div className="text-5xl mb-4">🏠</div>
                            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Buyer</h3>
                            <p className="text-sm text-dim">Explore verified buildings and own property through secure blockchain technology.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
