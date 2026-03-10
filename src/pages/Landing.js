import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../Footer';
import './Landing.css';

// Real property images from Unsplash (no ThreeBackground needed for landing)
const HERO_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80';
const STEP_IMAGES = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
];

function Home() {
  const [heroHovered, setHeroHovered] = useState(false);
  const heroImgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!heroImgRef.current) return;
    const rect = heroImgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    heroImgRef.current.style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
  };

  const handleMouseLeave = () => {
    if (!heroImgRef.current) return;
    heroImgRef.current.style.transform = 'scale(1) translate(0px, 0px)';
    setHeroHovered(false);
  };

  return (
    <div className="landing-page">

      {/* ── HERO ── */}
      <section className="hero-split">
        {/* Left */}
        <div className="hero-left">
          <span className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            Web3 Real Estate Platform
          </span>
          <h1 className="hero-headline">
            Building Common Ground<br />
            <em>On-Chain.</em>
          </h1>
          <p className="hero-sub">
            Transparent. Verified. Decentralized.<br />
            Buy and sell property directly on the Ethereum blockchain — no agents, no fraud, just code.
          </p>
          <div className="hero-ctas">
            <Link to="/properties" className="btn-explore">Explore Properties</Link>
            <Link to="/#how-it-works" className="btn-how">How it works →</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">42+</span>
              <span className="stat-label">Properties</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-num">15k</span>
              <span className="stat-label">Transactions</span>
            </div>
          </div>
        </div>

        {/* Right — image panel */}
        <div
          className="hero-right"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <img
            ref={heroImgRef}
            src={HERO_IMAGE}
            alt="Luxury interior property"
            className="hero-img"
          />
          {heroHovered && (
            <div className="hero-img-tooltip">←&nbsp;&nbsp;Hover to explore&nbsp;&nbsp;→</div>
          )}
          {!heroHovered && (
            <div className="hero-img-tooltip dim">←&nbsp;&nbsp;Hover to explore&nbsp;&nbsp;→</div>
          )}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="about-section">
        <div className="about-inner">
          <div className="about-left">
            <span className="section-eyebrow">About MetaHive</span>
          </div>
          <div className="about-right">
            <h2 className="about-headline">
              At MetaHive, we believe property ownership should be open to everyone.
            </h2>
            <p className="about-sub">
              We combine Ethereum blockchain technology with a seamless user experience to make real estate transactions transparent, fraud-proof, and accessible. No brokers. No hidden fees. Just direct, verified ownership on-chain.
            </p>
          </div>
        </div>

        {/* Feature columns */}
        <div className="features-strip">
          {[
            { num: '01', title: 'Zero Fraud', sub: 'Immutable blockchain records' },
            { num: '02', title: 'No Agents', sub: 'Direct builder to buyer' },
            { num: '03', title: 'NFT Deeds', sub: 'Digital ownership proof' },
            { num: '04', title: 'Instant Transfer', sub: 'Smart contract escrow' },
            { num: '05', title: 'Open Access', sub: 'Fractional ownership' },
          ].map((f) => (
            <div key={f.num} className="feature-col">
              <span className="feature-num">{f.num}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-sub">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="how-section">
        <div className="how-header">
          <span className="section-eyebrow">The Process</span>
          <h2 className="how-headline">Simple. Transparent. On-Chain.</h2>
        </div>

        <div className="steps">
          {[
            {
              num: '01',
              icon: 'fas fa-building',
              title: 'List Your Property',
              desc: 'Upload property details and documents. Everything is stored on IPFS and minted as an NFT on the Ethereum blockchain.',
              img: STEP_IMAGES[0],
            },
            {
              num: '02',
              icon: 'fas fa-search',
              title: 'Browse & Verify',
              desc: 'Explore verified listings. Check full ownership history directly on the blockchain — completely transparent.',
              img: STEP_IMAGES[1],
            },
            {
              num: '03',
              icon: 'fas fa-bolt',
              title: 'Buy Instantly',
              desc: 'Connect your MetaMask wallet, initiate purchase. Smart contract handles escrow and transfers NFT ownership automatically.',
              img: STEP_IMAGES[2],
            },
          ].map((step) => (
            <div key={step.num} className="step-row">
              <div className="step-number">{step.num}</div>
              <div className="step-body">
                <div className="step-icon-wrap">
                  <i className={step.icon}></i>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
              <div className="step-image-wrap">
                <img src={step.img} alt={step.title} className="step-img" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-banner-left">
          <span className="section-eyebrow">Get Started</span>
          <h2 className="cta-headline">
            Start Trading<br />Properties<br />Today.
          </h2>
          <p className="cta-sub">
            Join MetaHive and experience real estate on the blockchain. Verified, instant, yours.
          </p>
          <Link to="/properties" className="btn-explore">Explore Properties</Link>
        </div>
        <div className="cta-banner-right" aria-hidden="true">
          <span className="cta-watermark">"Real<br />estate,<br />reimagined."</span>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;