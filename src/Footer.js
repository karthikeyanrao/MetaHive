import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About MetaHive</h4>
          <p>Transforming the way you discover and invest in premium real estate through blockchain technology and innovation.</p>
          <div className="social-links" >
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/properties">Properties</Link></li>
            <li><Link to="/">About Us</Link></li>
            <li><Link to="/">Contact</Link></li>
            <li><Link to="/">FAQ</Link></li>
          </ul>
        </div>


        <div className="footer-section">
          <h4>Contact Info</h4>
          <ul className="contact-info">
            <li><i className="fas fa-user"></i> Advitya</li>
            <li><i className="fas fa-map-marker-alt"></i> 123 Dubai Street, Dubai Main Road, Dubai</li>
            <li><i className="fas fa-phone"></i> +91 9876543210</li>
            <li><i className="fas fa-envelope"></i> info@metahive.com</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Subscribe to our newsletter for updates and exclusive offers.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 MetaHive. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 