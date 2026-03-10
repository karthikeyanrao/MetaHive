import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from './context/Web3Context';
import { useAuth } from './context/AuthContext';
import { apiGetPropertyById, apiGetUserById, apiCreatePurchase } from './api';
import PropertyReceipt from './receipt';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SchedulingModal from './SchedulingModal';
import BuildingBadge from './BuildingBadge';
import "./PropertyDetails.css";

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3();
  const { currentUser, userRole } = useAuth();

  const [property, setProperty] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSold, setIsSold] = useState(() => localStorage.getItem(`property_${id}_sold`) === 'true');
  const [nftMinted, setNftMinted] = useState('No');
  const NFT_CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [paymentStatus, setPaymentStatus] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [builderInfo, setBuilderInfo] = useState({ name: 'Loading...', email: 'Loading...', phone: 'Loading...' });

  const fetchBuilderInfo = async () => {
    try {
      if (property.builderId) {
        const userData = await apiGetUserById(property.builderId);
        if (userData) {
          setBuilderInfo({
            name: userData.fullName || userData.name || 'Not available',
            email: userData.email || 'Not available',
            phone: userData.phone || 'Not available'
          });
        }
      }
    } catch (e) {
      console.error('Builder info error:', e);
    }
  };

  const handleScheduleViewing = () => {
    fetchBuilderInfo();
    setShowSchedulingModal(true);
  };

  // Fetch data
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const docData = await apiGetPropertyById(id);
        if (docData) {
          const pDetails = docData.propertyDetails || {};
          const isSoldStatus = (docData.status || '').toLowerCase() === 'sold' || (docData.isSold || '').toLowerCase() === 'yes' || (docData.isSold || '').toLowerCase() === 'sold';

          setProperty({
            title: docData.title || pDetails.title || 'Untitled',
            location: docData.address || pDetails.address || docData.location || pDetails.location || 'Unknown Location',
            amount: docData.price || pDetails.price || 0,
            bedrooms: docData.bedrooms || pDetails.bedrooms || 0,
            bathrooms: docData.bathrooms || pDetails.bathrooms || 0,
            area: docData.area || pDetails.area || 0,
            furnished: docData.furnishedStatus || pDetails.furnishedStatus || 'Non-Furnished',
            builderName: docData.builderName || pDetails.builderName || 'Not available',
            builderEmail: docData.builderEmail || 'Not available',
            builderId: docData.builderId,
            description: docData.description || pDetails.description || 'No description provided.',
            rawMaterials: docData.rawMaterials || pDetails.rawMaterials || 'Standard construction materials used.',
            buildingDescription: docData.buildingDescription || pDetails.buildingDescription || 'Modern architectural structure with premium finishes.',
            details: docData.details || pDetails.details || 'Includes essential fittings and quality hardware.',
            amenities: docData.amenities || pDetails.amenities || [],
            nftData: docData.nftData || pDetails.nftData || {},
            images: (() => {
              const dImages = Array.isArray(docData.images) ? docData.images : [];
              const pImages = Array.isArray(pDetails.images) ? pDetails.images : [];
              const combined = [...new Set([...dImages, ...pImages])].filter(Boolean);
              return combined;
            })()
          });

          setNftMinted(docData.NftMinted || pDetails.NftMinted || 'No');
          setIsSold(isSoldStatus);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [id]);

  const handlePayment = async () => {
    try {
      if (nftMinted !== 'Yes') return;
      if (!isConnected) { alert('Connect wallet first'); return; }
      if (!currentUser) { alert('Login to purchase'); return; }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const realTokenId = property.nftData?.realTokenId;
      const builderWallet = property.nftData?.mintedBy;

      if (realTokenId === undefined || !builderWallet) {
        alert("NFT data incomplete."); return;
      }

      const NFT_ABI = ["function buyProperty(uint256 tokenId, address payable currentOwner) public payable"];
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const amountToSend = ethers.parseEther("0.00005");

      setPaymentStatus('Processing payment...');
      const tx = await nftContract.buyProperty(realTokenId, builderWallet, { gasLimit: 500000, value: amountToSend });
      await tx.wait();

      toast.success('NFT transferred successfully from Builder to Buyer!', { theme: 'colored' });
      const buyerWallet = await signer.getAddress();

      await apiCreatePurchase({
        propertyId: id,
        builderId: property.builderId,
        amount: property.amount,
        transactionHash: tx.hash,
        buyerAddress: buyerWallet,
        buyerName: currentUser?.displayName || 'Anonymous'
      });

      setIsSold(true);
      setPaymentStatus('');

      setReceiptData({
        builderName: property.builderName,
        builderEmail: property.builderEmail,
        buyerName: currentUser?.displayName,
        buyerAddress: account,
        propertyDetails: {
          title: property.title, location: property.location, area: property.area, price: property.amount,
          bedrooms: property.bedrooms, bathrooms: property.bathrooms, furnishedStatus: property.furnished,
          nftMinted: nftMinted
        },
        amountPaid: property.amount, transactionHash: tx.hash, contractAddress: NFT_CONTRACT_ADDRESS,
        senderAddress: account, receiverAddress: builderWallet
      });
      setShowReceipt(true);
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message || 'Please try again'}`);
      setPaymentStatus('');
    }
  };

  if (loading) return null; // or a spinner

  const heroImage = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80';

  return (
    <div className="pd-page">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Hero Panoramic Image */}
      <div className="pd-hero">
        <img src={heroImage} alt="Property" className="pd-hero-img" />
        <div className="pd-hero-overlay"></div>
        <div className="pd-hero-content">
          <h1 className="pd-title">{property.title}</h1>
          <div className="pd-location">
            <i className="fas fa-map-marker-alt"></i>
            {property.location}
          </div>
        </div>
      </div>

      {/* Full Width Stats Bar */}
      <div className="pd-stats-bar">
        <div className="pd-stats-inner">
          <div className="pd-stat-group price">
            <span className="pd-stat-label">Price</span>
            <span className="pd-stat-value">${Number(property.amount).toLocaleString()}</span>
          </div>
          <div className="pd-stat-group">
            <span className="pd-stat-label">Bedrooms</span>
            <span className="pd-stat-value">{property.bedrooms}</span>
          </div>
          <div className="pd-stat-group">
            <span className="pd-stat-label">Bathrooms</span>
            <span className="pd-stat-value">{property.bathrooms}</span>
          </div>
          <div className="pd-stat-group">
            <span className="pd-stat-label">Area</span>
            <span className="pd-stat-value">{property.area} sqft</span>
          </div>
          <div className="pd-stat-group">
            <span className="pd-stat-label">Furnished</span>
            <span className="pd-stat-value">{property.furnished}</span>
          </div>
        </div>
      </div>

      {/* Main 2-column Grid */}
      <div className="pd-main-grid">

        {/* Left Column */}
        <div className="pd-left">

          {property.images && property.images.length > 1 && (
            <div className="pd-section">
              <h2>Property Gallery</h2>
              <div className="pd-gallery-grid">
                {property.images.slice(1).map((img, idx) => (
                  <div key={idx} className="pd-gallery-item">
                    <img src={img} alt={`Gallery ${idx}`} onClick={() => window.open(img, '_blank')} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pd-section">
            <h2>About this property</h2>
            <p className="pd-desc-text">{property.description}</p>
          </div>

          <div className="pd-section">
            <h2>Building Specifications</h2>
            <div className="pd-specs-grid">
              <div className="pd-spec-card">
                <i className="fas fa-tools"></i>
                <div className="pd-spec-info">
                  <span className="label">Raw Materials</span>
                  <p>{property.rawMaterials}</p>
                </div>
              </div>
              <div className="pd-spec-card">
                <i className="fas fa-building"></i>
                <div className="pd-spec-info">
                  <span className="label">Structure</span>
                  <p>{property.buildingDescription}</p>
                </div>
              </div>
              <div className="pd-spec-card">
                <i className="fas fa-info-circle"></i>
                <div className="pd-spec-info">
                  <span className="label">Fittings & Details</span>
                  <p>{property.details}</p>
                </div>
              </div>
            </div>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div className="pd-section">
              <h2>Amenities</h2>
              <div className="pd-amenities-list">
                {property.amenities.map((item, idx) => (
                  <span key={idx} className="pd-amenity-tag">
                    <i className="fas fa-check"></i>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pd-section">
            <h2>On-Chain Ownership</h2>
            <div className="pd-card">
              <div className="pd-card-header">
                <i className="fas fa-certificate"></i>
                <span>NFT Verification Box</span>
              </div>
              <div className="pd-card-body">
                <BuildingBadge
                  key={`badge-${isSold}-${nftMinted}`}
                  contractAddress={NFT_CONTRACT_ADDRESS}
                  tokenId={0}
                  isSold={isSold}
                  propertyTitle={property.title}
                  nftMinted={nftMinted}
                  propertyId={id}
                  onMinted={() => setNftMinted('Yes')}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="pd-right">

          <div className="pd-card highlight">
            <div className="pd-card-header">
              <span>Purchase Actions</span>
            </div>
            <div className="pd-card-body">
              <div className="pd-actions">
                <button className="pd-action-btn" onClick={() => {
                  fetchBuilderInfo();
                  window.location.href = `mailto:${builderInfo.email}?subject=Inquiry about ${property.title}`;
                }}>
                  <i className="fas fa-envelope"></i>
                  Contact Builder
                </button>
                <button className="pd-action-btn" onClick={handleScheduleViewing}>
                  <i className="fas fa-calendar-alt"></i>
                  Schedule a Visit
                </button>

                {isSold ? (
                  <button className="pd-action-btn sold" disabled>Sold Out</button>
                ) : userRole?.toLowerCase() === 'buyer' ? (
                  <button
                    className={`pd-action-btn buy ${nftMinted === 'Yes' && isConnected ? 'primary' : ''}`}
                    onClick={handlePayment}
                    disabled={!isConnected || nftMinted !== 'Yes' || paymentStatus !== ''}
                  >
                    {paymentStatus ? paymentStatus : nftMinted === 'Yes' ? 'Buy Property' : 'NFT Not Minted'}
                  </button>
                ) : (
                  <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '10px' }}>
                    Login as Buyer to purchase
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card-header">
              <span>Builder Information</span>
            </div>
            <div className="pd-card-body">
              <div className="pd-builder-profile">
                <div className="pd-builder-avatar">
                  {property.builderName?.charAt(0)}
                </div>
                <div className="pd-builder-text">
                  <h4>{property.builderName}</h4>
                  <p>Verified Property Developer</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <SchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => setShowSchedulingModal(false)}
        builderInfo={builderInfo}
        propertyInfo={{ title: property.title, location: property.location }}
      />

      {showReceipt && receiptData && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal">
            <button className="close-modal" onClick={() => setShowReceipt(false)}>×</button>
            <div dangerouslySetInnerHTML={{ __html: new PropertyReceipt(receiptData).generateHTMLReceipt() }} />
            <button
              className="pd-action-btn primary"
              style={{ marginTop: '24px' }}
              onClick={async () => {
                const receipt = new PropertyReceipt(receiptData);
                await receipt.downloadPDF();
              }}
            >
              Download PDF Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default PropertyDetails;