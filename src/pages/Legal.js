import React from 'react';

const Legal = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl">
                <h1 className="text-4xl font-black mb-8 text-primary">LEGAL & COMPLIANCE</h1>
                <div className="space-y-8 text-dim">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Blockchain Real Estate Regulation</h2>
                        <p>MetaHive operates under the evolving framework of digital asset regulation. Every NFT minted on our platform represents a legal claim to physical property, secured by smart contracts that comply with regional property transfer laws.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Terms of Service</h2>
                        <p>By using MetaHive, you acknowledge that property transactions are peer-to-peer and irreversible once confirmed on the blockchain. We provide the infrastructure for verification but do not act as a traditional brokerage.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Privacy & Data Protection</h2>
                        <p>Your wallet address is the primary identifier. No personal data is stored on-chain. Off-chain data (Firebase) is encrypted and used only for platform authentication and identity verification.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Legal;
