import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      {/* Brand row */}
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">METAHIVE</span>
          <p className="footer-tagline">Building common ground on-chain.</p>
        </div>
        <div className="footer-nav-cols">
          <div className="footer-col">
            <span className="footer-col-heading">Platform</span>
            <ul>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/#how-it-works">How it works</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <span className="footer-col-heading">Legal</span>
            <ul>
              <li><Link to="/">Privacy Policy</Link></li>
              <li><Link to="/">Terms of Service</Link></li>
              <li><Link to="/">Blockchain Disclaimer</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© 2026 MetaHive. All rights reserved.</p>
        <p className="footer-built">Built on Ethereum Sepolia</p>
      </div>
    </footer>
  );
}

export default Footer;