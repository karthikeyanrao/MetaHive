import React, { useState, useEffect } from "react";
import "./PropertyDetail.css";
import home from "../home.png";
import ThreeBackground from '../ThreeBackground';
import SchedulingModal from './SchedulingModal';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { SENDER_ADDRESS, SENDER_ABI } from '../contracts/SenderContract';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetPropertyById, apiGetUserById, apiDeleteProperty, apiCreatePurchase } from '../api';
import BuildingBadge from '../BuildingBadge';
import PropertyReceipt from '../receipt';


import b1 from '../b1.jpg';
import b2 from '../b2.jpg';
import be1 from '../be1.jpg';
import k1 from '../k1.jpg';


function PropertyDetails() {
  const [showAgentPopup, setShowAgentPopup] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const { isConnected, account } = useWeb3();
  const { currentUser, userRole } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isSold, setIsSold] = useState(() => {
    return localStorage.getItem(`property_${id}_sold`) === 'true'
  });
  const [property, setProperty] = useState({});
  const [nftMinted, setNftMinted] = useState('No');
  const NFT_CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [loading, setLoading] = useState(true);
  // userRole now comes from useAuth() — remove local state
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [builderInfo, setBuilderInfo] = useState({
    name: 'Loading...',
    email: 'Loading...',
    phone: 'Loading...'
  });

  const toggleAgentPopup = () => {
    setShowAgentPopup(!showAgentPopup);
  };

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
    } catch (error) {
      console.error('Error fetching builder info:', error);
      setBuilderInfo({
        name: 'Not available',
        email: 'Not available',
        phone: 'Not available'
      });
    }
  };

  const handleScheduleViewing = () => {
    fetchBuilderInfo();
    setShowSchedulingModal(true);
  };



  // Build gallery images - use real IPFS images from DB, fallback to static defaults
  const fallbackImages = [
    { id: 1, url: be1, alt: 'Living Room' },
    { id: 2, url: k1, alt: 'Kitchen' },
    { id: 3, url: b1, alt: 'Master Bedroom' },
    { id: 4, url: b2, alt: 'Bathroom' },
  ];

  const images = (property.images && property.images.length > 0)
    ? property.images.slice(0, 5).map((url, i) => ({ id: i + 1, url, alt: `Property Image ${i + 1}` }))
    : fallbackImages;

  const features = {
    basics: [
      { icon: "fa-bed", text: "Bedrooms", value: property.bedrooms },
      { icon: "fa-bath", text: "Bathrooms", value: property.bathrooms },
      { icon: "fa-ruler-combined", text: "Square Feet", value: property.area },
      { icon: "fa-car", text: "Garage", value: "2 Cars" },
      { icon: "fa-money-bill", text: "Furnished", value: property.furnished },
    ],
    comfort: [
      { icon: "fa-fan", text: "Climate Control", value: "Central AC" },
      { icon: "fa-swimming-pool", text: "Pool", value: "2" },
      { icon: "fa-hot-tub", text: "Spa", value: "Jacuzzi" },
      { icon: "fa-sun", text: "Lighting", value: "Smart LED" },
    ],
    security: [
      { icon: "fa-shield-alt", text: "Security System", value: "24/7" },
      { icon: "fa-video", text: "Surveillance", value: "HD Cameras" },
      { icon: "fa-key", text: "Access", value: "Biometric" },
      { icon: "fa-parking", text: "Parking", value: "Secured" },
    ],
  };

  // Property amenities from database (real data)
  const propertyAmenities = property.amenities || [];

  const handlePayment = async () => {
    try {
      if (nftMinted !== 'Yes') {
        setPaymentStatus('NFT not minted. Payment disabled.');
        return;
      }

      if (!isConnected) {
        alert('Please connect your wallet first');
        return;
      }

      if (!currentUser) {
        alert('Please login to make a purchase');
        setPaymentStatus('');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Ensure NFT data is complete
      const realTokenId = property.nftData?.realTokenId;
      const builderWallet = property.nftData?.mintedBy;

      if (realTokenId === undefined || !builderWallet) {
        alert("NFT data is incomplete or has not been fully verified on the blockchain. Cannot process payment.");
        setPaymentStatus('');
        return;
      }

      // ABI matching RealEstateNFT.buyProperty
      const NFT_ABI = [
        "function buyProperty(uint256 tokenId, address payable currentOwner) public payable"
      ];
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        signer
      );

      const amountToSend = ethers.parseEther("0.00005");
      setPaymentStatus('Processing payment...');

      console.log(`Calling buyProperty with: {realTokenId: ${realTokenId}, builderWallet: "${builderWallet}"}`);
      const tx = await nftContract.buyProperty(
        realTokenId,
        builderWallet,
        { gasLimit: 500000, value: amountToSend }
      );
      await tx.wait();

      console.log('buyProperty tx confirmed!');
      alert('NFT transferred successfully from Builder to Buyer!');

      // Get the buyer's on-chain wallet address
      const buyerWallet = await signer.getAddress();

      // Create a purchase record via API
      // Backend will: create Purchase doc + mark property 'sold' + transfer NFT ownership to buyer
      await apiCreatePurchase({
        propertyId: id,
        builderId: property.builderId,
        amount: property.amount,
        transactionHash: tx.hash,
        buyerAddress: buyerWallet,                               // on-chain MetaMask address
        buyerName: currentUser?.displayName || 'Anonymous'   // display name
      });


      setIsSold(true);

      // Generate receipt data after successful payment
      const receiptInfo = {
        builderName: property.builderName || 'Not available',
        builderEmail: property.builderEmail || 'Not available',
        builderId: property.builderId,
        buyerName: currentUser?.displayName || 'Anonymous',
        buyerAddress: account,
        propertyDetails: {
          title: property.title || 'N/A',
          location: property.location || 'N/A',
          area: property.area || 'N/A',
          price: property.amount || 'N/A',
          bedrooms: property.bedrooms || 'N/A',
          bathrooms: property.bathrooms || 'N/A',
          furnishedStatus: property.furnished || 'N/A',
          nftMinted: property.nftMinted || 'No',
          buildingDescription: property.buildingDescription || 'N/A',
          latitude: property.latitude || 'N/A',
          longitude: property.longitude || 'N/A'
        },
        amountPaid: property.amount,
        transactionHash: tx.hash,
        contractAddress: NFT_CONTRACT_ADDRESS,
        senderAddress: account,
        receiverAddress: builderWallet

      };

      setReceiptData(receiptInfo);
      setShowReceipt(true);
      setPaymentStatus('');
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('');
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient funds to complete the transaction');
      } else {
        alert(`Payment failed: ${error.message || 'Please try again'}`);
      }
    }
  };

  const handleDownloadReceipt = async () => {
    if (receiptData) {
      const receipt = new PropertyReceipt(receiptData);
      await receipt.downloadPDF();
    }
  };

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const docData = await apiGetPropertyById(id);

        if (docData) {
          const pDetails = docData.propertyDetails || {};

          setProperty({
            title: pDetails.title || docData.title || 'Untitled',
            location: pDetails.address || docData.location || docData.address || 'Unknown Location',
            amount: pDetails.price || docData.price || 0,
            isSold: (docData.status || '').toLowerCase() === 'sold' || (docData.isSold || '').toLowerCase() === 'yes' || (docData.isSold || '').toLowerCase() === 'sold' ? 'Sold' : 'New',
            bedrooms: pDetails.bedrooms || docData.bedrooms || 0,
            bathrooms: pDetails.bathrooms || docData.bathrooms || 0,
            area: pDetails.area || docData.area || 0,
            furnished: pDetails.furnishedStatus || docData.furnishedStatus || 'Non-Furnished',
            nftMinted: pDetails.NftMinted || docData.NftMinted || 'No',
            builderName: docData.builderName || docData.propertyDetails?.builderName || 'Not available',
            builderEmail: docData.builderEmail || 'Not available',
            builderId: docData.builderId,
            buildingDescription: pDetails.buildingDescription || docData.buildingDescription || docData.description || 'No description',
            description: pDetails.description || docData.description || '',
            rawMaterials: pDetails.rawMaterials || docData.rawMaterials || '',
            details: pDetails.details || docData.details || '',
            latitude: pDetails.location?.lat || docData.lat || 'N/A',
            longitude: pDetails.location?.lng || docData.lng || 'N/A',
            nftData: docData.nftData || pDetails.nftData || {},
            // Real images from IPFS — support both flat and nested schemas
            images: (() => {
              const raw = pDetails.images || docData.images || [];
              if (Array.isArray(raw)) return raw.filter(Boolean);
              if (typeof raw === 'string') return raw ? [raw] : [];
              return [];
            })(),
            amenities: (() => {
              const raw = pDetails.amenities || docData.amenities || [];
              if (Array.isArray(raw)) return raw.filter(Boolean);
              if (typeof raw === 'object' && !Array.isArray(raw)) {
                return Object.entries(raw)
                  .filter(([, val]) => val === true || val === 'true')
                  .map(([key]) => key);
              }
              return [];
            })()
          });

          // NftMinted is a flat top-level field in the DB (not inside propertyDetails)
          // Always read flat first, fall back to nested
          const resolvedNftMinted = docData.NftMinted || pDetails.NftMinted || 'No';
          console.log('[PropertyDetails] NftMinted flat:', docData.NftMinted, '| nested:', pDetails.NftMinted, '=> resolved:', resolvedNftMinted);
          setNftMinted(resolvedNftMinted);
          setIsSold((docData.status || '').toLowerCase() === 'sold' || (docData.isSold || '').toLowerCase() === 'yes' || (docData.isSold || '').toLowerCase() === 'sold');
        } else {
          alert('Property not found.');
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    const fetchCurrentUserDetails = async () => {
      if (currentUser) {
        try {
          const userData = await apiGetUserById(currentUser.uid);
          if (userData) {
            setCurrentUserEmail(userData.email);
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    };

    fetchCurrentUserDetails();
  }, [currentUser]);


  return (
    <>
      <ThreeBackground />
      <div className={`property-details ${isSold ? 'sold-out' : ''}`}>
        <div className="property-header">
          <div className="header-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 className="property-title">{property.title}</h1>
            <div className="property-location">
              <i className="fas fa-map-marker-alt"></i>
              {property.location}
            </div>
            <div className="title-price-row">

              <div className="property-price">${property.amount}</div>
            </div>

            <div className="property-tags">
              <span className="tag">Premium</span>
              <span className="tag">Verified</span>
              {isSold ? (
                <span className="tag sold">Sold</span>
              ) : (
                <span className="tag">New</span>
              )}
            </div>
          </div>
        </div>

        <div className="gallery-container">
          <div className="main-image">
            <img src={selectedImage || images[0].url} alt="Main view" />
            {isSold && (
              <div className="sold-overlay">
                <span className="sold-text">SOLD OUT</span>
              </div>
            )}
          </div>
          <div className="gallery-thumbnails">
            {images.map((image) => (
              <div
                key={image.id}
                className={`thumbnail ${selectedImage === image.url ? "active" : ""
                  }`}
                onClick={() => setSelectedImage(image.url)}
              >
                <img src={image.url} alt={image.alt} />
              </div>
            ))}
          </div>
        </div>

        <div className="property-details-grid">
          <div className="property-description">
            <h2 className="description-title">About this property</h2>
            <div className="description-content">
              {property.description && <p>{property.description}</p>}
              {property.buildingDescription && (
                <div className="highlights">
                  <h3>Building Description</h3>
                  <p>{property.buildingDescription}</p>
                </div>
              )}
              {property.rawMaterials && (
                <div className="highlights">
                  <h3>Raw Materials Used</h3>
                  <p>{property.rawMaterials}</p>
                </div>
              )}
              {property.details && (
                <div className="highlights">
                  <h3>Property Details</h3>
                  <p>{property.details}</p>
                </div>
              )}
              <div className="highlights">
                <h3>Property Specs</h3>
                <ul>
                  <li>{property.bedrooms} Bedrooms · {property.bathrooms} Bathrooms</li>
                  <li>{property.area} sq ft · {property.furnished || 'Status N/A'}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="property-sidebar">
            <div className="features-section">
              <h2 className="features-title">Property Features</h2>
              {Object.entries(features).map(([category, items]) => (
                <div key={category} className="feature-category">
                  <h3 className="category-title">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="features-list">
                    {items.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <div className="feature-icon">
                          <i className={`fas ${feature.icon}`}></i>
                        </div>
                        <div className="feature-content">
                          <div className="feature-text">{feature.text}</div>
                          <div className="feature-value">{feature.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="amenities-section">
              <h2 className="features-title">Amenities</h2>
              <div className="amenities-list">
                {propertyAmenities.length > 0 ? (
                  propertyAmenities.map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      <i className="fas fa-check"></i>
                      <span>{amenity}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>No amenities listed</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <div className="agent-info">
            <div className="agent-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="agent-details">
              <h3>{property.builderName}</h3>
              <p>Luxury Property Specialist</p>
            </div>
          </div>
          <div className="contact-buttons">

            <button
              className="contact-button"
              onClick={toggleAgentPopup}
            >
              <i className="fas fa-phone-alt"></i> Contact Builder
            </button>
            {!isSold ? (
              <>
                <button
                  className="schedule-button"
                  onClick={handleScheduleViewing}
                >
                  <i className="fas fa-calendar-alt"></i> Schedule Viewing
                </button>

                {/* Pay Now — only for buyers */}
                {(userRole?.toLowerCase() === 'buyer') && (
                  <button
                    className="pay-button"
                    onClick={handlePayment}
                    disabled={!isConnected || nftMinted !== 'Yes'}
                    title={nftMinted !== 'Yes' ? 'NFT must be minted before purchase' : !isConnected ? 'Connect your wallet' : ''}
                    style={{ cursor: (!isConnected || nftMinted !== 'Yes') ? 'not-allowed' : 'pointer' }}
                  >
                    <i className="fas fa-credit-card"></i>
                    {nftMinted !== 'Yes' ? 'Pay Now (NFT Not Minted)' : 'Pay Now'}
                  </button>
                )}
              </>
            ) : (
              <div className="sold-badge">🏠 Property Sold</div>
            )}

            {paymentStatus && (
              <div className={`payment-status ${paymentStatus.includes('failed') ? 'error' : ''}`}>
                {paymentStatus}
              </div>
            )}
          </div>
        </div>

        {showAgentPopup && (
          <>
            <div className="overlay" onClick={toggleAgentPopup}></div>
            <div className="agent-popup">
              <div className="popup-content">
                <span className="close-button" onClick={toggleAgentPopup}>&times;</span>
                <h2>Builder Details</h2>
                <p><strong>Name:</strong> {property.builderName || 'Not available'}</p>
                <p><strong>Email:</strong> {property.builderEmail || 'Not available'}</p>
                <p><strong>Address:</strong> 123 Luxury St, Metropolis</p>
                <p className="rating">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
          </>
        )}
        <div className={`verification-section ${isSold ? 'sold-out' : ''}`}>
          <h2>Property Verification</h2>
          <BuildingBadge
            key={`badge-${isSold}`}
            contractAddress={NFT_CONTRACT_ADDRESS}
            tokenId={0}
            isSold={isSold}
            propertyTitle={property.title}
            nftMinted={nftMinted}
            propertyId={id}
            onMinted={() => setNftMinted('Yes')}
          />
        </div>
        <div>

        </div>

      </div>
      {showReceipt && receiptData && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal">
            <button className="close-modal" onClick={() => setShowReceipt(false)}>×</button>
            <div dangerouslySetInnerHTML={{
              __html: new PropertyReceipt(receiptData).generateHTMLReceipt()
            }} />
            <button className="download-receipt" onClick={handleDownloadReceipt}>
              Download Receipt
            </button>
          </div>
        </div>
      )}

      <SchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => setShowSchedulingModal(false)}
        builderInfo={builderInfo}
        propertyInfo={{
          title: property.title || 'Property',
          location: property.location || 'Location not specified'
        }}
      />
    </>
  );
}

export default PropertyDetails;