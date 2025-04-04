import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThreeBackground from './ThreeBackground';
import Footer from './Footer';
import './Home.css';

function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//code.tidio.co/w0extlr3fsolssypadddmgmxknbooasn.js"; // Your chatbot script
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Cleanup when unmounting
    };
  }, []);

  return (
    <div className="home">
      <ThreeBackground />
      <section className="hero-section">
        <h1>The Future of MetaHive</h1>
        <p>
        Discover properties so extraordinary that even your dream home will take a second look.  
        Your future address is waiting in our curated collection—go explore!
        </p>
        <Link to="/properties" className="cta-button">
          Explore Buildings
        </Link>
      </section>

      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-file-contract"></i>
            <h3>Smart Contracts</h3>
            <p>Automated, secure, and trustless transactions powered by blockchain technology for seamless property dealings.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-cube"></i>
            <h3>NFT Integration</h3>
            <p>Unique digital property tokens ensuring authentic ownership and enabling fractional real estate investment.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-layer-group"></i>
            <h3>Transparency</h3>
            <p>Complete visibility of property history, ownership, and transactions through immutable blockchain records.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Home; 