import React, { useState, useEffect } from "react";
import "./PropertyDetails.css";
import home from "./home.png";
import ThreeBackground from './ThreeBackground';
import SchedulingModal from './SchedulingModal';
import { ethers } from 'ethers';
import { useWeb3 } from './context/Web3Context';
import { useAuth } from './context/AuthContext';
import { SENDER_ADDRESS, SENDER_ABI } from './contracts/SenderContract';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "./context/firebase"; // Ensure db is properly exported
import { doc, deleteDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import BuildingBadge from './BuildingBadge';
import PropertyReceipt from './receipt';
import { toast } from 'react-toastify';

import b1 from './b1.jpg';
import b2 from './b2.jpg';
import be1 from './be1.jpg';
import k1 from './k1.jpg';



function PropertyDetails() {
  const [showAgentPopup, setShowAgentPopup] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const { isConnected, account } = useWeb3();
  const { currentUser } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isSold, setIsSold] = useState(() => {
    return localStorage.getItem(`property_${id}_sold`) === 'true'
  });
  const [property, setProperty] = useState({});
  // Issue #3: NFT contract address from env var
  const NFT_CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [paymentEthAmount, setPaymentEthAmount] = useState(null);
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
        const userDoc = await getDoc(doc(db, 'Users', property.builderId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBuilderInfo({
            name: userData.name || 'Not available',
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

  // Fetch live ETH/USD price from CoinGecko
  const fetchEthPrice = async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await res.json();
      return data?.ethereum?.usd || null;
    } catch (err) {
      console.error('Failed to fetch ETH price:', err);
      return null;
    }
  };

  const handleScheduleViewing = () => {
    fetchBuilderInfo();
    setShowSchedulingModal(true);
  };

  const handleDelete = async () => {

    if (!currentUser) {
      toast.error('You must be logged in to delete a property.');
      return;
    }
    if (property.builderId !== currentUser.uid) {
      toast.error('You are not authorized to delete this property. Only the listing builder can delete it.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const propertiesCollection = collection(db, 'properties');
        const q = query(propertiesCollection, where('id', '==', id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const propertyDoc = querySnapshot.docs[0].ref;
          await deleteDoc(propertyDoc);
          toast.success('Property deleted successfully!');
          navigate('/properties');
          window.scrollTo(0, 0);
        } else {
          toast.warning('Property not found.');
        }
      } catch (error) {
        toast.error('Failed to delete property. Please try again.');
        console.error('Delete error', error);
      }
    }
  };


  const images = [
    { id: 1, url: be1, alt: "Living Room" },
    { id: 2, url: k1, alt: "Kitchen" },
    { id: 3, url: b1, alt: "Master Bedroom" },
    { id: 4, url: b2, alt: "Bathroom" },
  ];

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

  const amenities = [
    "Smart Home System",
    "24/7 Security",
    "Fitness Center",
    "Rooftop Garden",
    "Wine Cellar",
    "Home Theater",
  ];

  const handlePayment = async () => {
    try {
      if (property?.nftMinted !== 'Yes') {
        setPaymentStatus('NFT not minted. Payment disabled.');
        return;
      }

      if (!isConnected) {
        toast.warning('Please connect your wallet first');
        return;
      }

      if (!currentUser) {
        toast.warning('Please login to make a purchase');
        setPaymentStatus('');
        return;
      }

      // Fetch live ETH/USD price and compute property cost in ETH
      setPaymentStatus('Fetching live ETH price...');
      const ethPriceUsd = await fetchEthPrice();
      if (!ethPriceUsd) {
        toast.error('Could not fetch live ETH price. Please try again.');
        setPaymentStatus('');
        return;
      }

      const propertyPriceUsd = Number(property.amount);
      if (!propertyPriceUsd || propertyPriceUsd <= 0) {
        toast.error('Invalid property price.');
        setPaymentStatus('');
        return;
      }

      const ethAmount = (propertyPriceUsd / ethPriceUsd).toFixed(8);
      setPaymentEthAmount(ethAmount);

      const confirmed = window.confirm(
        `Property price: $${propertyPriceUsd.toLocaleString()} USD\n` +
        `Live ETH price: $${ethPriceUsd.toLocaleString()} USD\n` +
        `Amount to pay: ${ethAmount} ETH\n\nProceed with payment?`
      );
      if (!confirmed) {
        setPaymentStatus('');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();

      // DEBUG: Log what nftData we have
      console.log('=== PURCHASE DEBUG ===');
      console.log('property.nftData:', JSON.stringify(property.nftData));
      console.log('NFT_CONTRACT_ADDRESS:', NFT_CONTRACT_ADDRESS);

      // The builder's on-chain wallet is whoever minted the NFT (stored in nftData.mintedBy)
      const builderWallet = property.nftData?.mintedBy;
      console.log('builderWallet:', builderWallet);
      if (!builderWallet) {
        toast.error('Cannot determine property owner wallet. The NFT must be minted first.');
        console.error('FAILED: builderWallet is falsy. property.nftData =', property.nftData);
        setPaymentStatus('');
        return;
      }

      // The real blockchain token ID (integer) stored when builder minted
      const realTokenId = property.nftData?.realTokenId;
      console.log('realTokenId:', realTokenId);
      if (realTokenId === undefined || realTokenId === null) {
        toast.error('Cannot determine NFT Token ID. Please ask the builder to re-mint.');
        console.error('FAILED: realTokenId is missing. property.nftData =', property.nftData);
        setPaymentStatus('');
        return;
      }

      const amountToSend = ethers.parseEther(ethAmount);
      setPaymentStatus(`Executing Secure Smart Contract Payment of ${ethAmount} ETH...`);

      console.log('Calling buyProperty with:', { realTokenId, builderWallet, amountToSend: amountToSend.toString() });
      toast.info(`Calling buyProperty: Token #${realTokenId}, Owner: ${builderWallet.substring(0, 10)}...`);

      // Atomic trade: sends ETH to Builder + transfers NFT to Buyer in one transaction
      const NFT_ABI = [
        "function buyProperty(uint256 tokenId, address currentOwner) public payable"
      ];
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

      const tx = await nftContract.buyProperty(
        realTokenId,
        builderWallet,
        { value: amountToSend }
      );

      console.log('buyProperty tx submitted:', tx.hash);
      setPaymentStatus(`Payment submitted! Waiting for Ethereum block confirmation...`);
      const receipt = await tx.wait();
      console.log('buyProperty tx confirmed! Block:', receipt.blockNumber);
      toast.success('NFT transferred successfully from Builder to Buyer!');

      // Update Firebase status
      const propertiesCollection = collection(db, 'properties');
      const q = query(propertiesCollection, where('id', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const propertyDoc = querySnapshot.docs[0].ref;
        await updateDoc(propertyDoc, {
          isSold: 'Sold',
          buyerId: currentUser.uid,
          buyerName: currentUser?.displayName || 'Anonymous',
          buyerAddress: buyerAddress,
          soldAt: new Date().toISOString(),
          nftData: {
            ...property.nftData,
            mintedBy: buyerAddress, // New on-chain owner is the Buyer
            previousOwner: builderWallet,
            transactionHash: tx.hash,
            purchaseDate: new Date().toISOString(),
            qrCodeUrl: "" // Forces the QR component to regenerate matching the new tx
          },
          // Ownership log: every transfer is permanently recorded
          ownershipLog: [
            ...(property.ownershipLog || []),
            {
              from: builderWallet,
              to: buyerAddress,
              transactionHash: tx.hash,
              tokenId: realTokenId,
              date: new Date().toISOString(),
              amountEth: ethAmount,
              amountUsd: property.amount
            }
          ]
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
          amountPaidUsd: property.amount,
          amountPaidEth: ethAmount,
          transactionHash: tx.hash,
          contractAddress: NFT_CONTRACT_ADDRESS,
          senderAddress: buyerAddress,
          receiverAddress: builderWallet
        };

        setReceiptData(receiptInfo);
        setShowReceipt(true);
        setPaymentStatus('');
      }
    } catch (error) {
      setPaymentStatus('');
      if (error.code === 'ACTION_REJECTED') {
        toast.warning('Transaction was rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Insufficient funds to complete the transaction');
      } else {
        toast.error(`Payment failed: ${error.message || 'Please try again'}`);
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
        const propertiesCollection = collection(db, 'properties');
        const q = query(propertiesCollection, where('id', '==', id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const propertyDetails = querySnapshot.docs[0].data(); // Get the first document's data

          // Fetch the NftMinted status
          const nftMintedStatus = propertyDetails.NftMinted; // Assuming NftMinted is a field in the property document


          setProperty({
            title: propertyDetails.title,
            location: propertyDetails.location,
            amount: propertyDetails.price,
            isSold: propertyDetails.isSold,
            bedrooms: propertyDetails.bedrooms,
            bathrooms: propertyDetails.bathrooms,
            area: propertyDetails.area,
            furnished: propertyDetails.furnishedStatus,
            nftMinted: propertyDetails.NftMinted,
            builderName: propertyDetails.builderName || 'Not available',
            builderEmail: propertyDetails.builderEmail || 'Not available',
            builderId: propertyDetails.builderId,
            buildingDescription: propertyDetails.buildingDescription || '',
            description: propertyDetails.description || '',
            rawMaterials: propertyDetails.rawMaterials || '',
            details: propertyDetails.details || '',
            amenities: propertyDetails.amenities || {},
            streetNumber: propertyDetails.streetNumber || '',
            latitude: propertyDetails.lat || 'N/A',
            longitude: propertyDetails.lng || 'N/A',
            nftData: propertyDetails.nftData || null,
            ownershipLog: propertyDetails.ownershipLog || []
          });

          setIsSold(propertyDetails.isSold === 'Sold');
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
          const userRef = doc(db, 'Users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUserEmail(userData.email);
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    };

    fetchCurrentUserDetails();
  }, [currentUser, property.builderEmail]);


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
                  {property.streetNumber && <li>Street: {property.streetNumber}</li>}
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
                {property.amenities && Object.entries(property.amenities)
                  .filter(([, val]) => val)
                  .map(([key]) => (
                    <div key={key} className="amenity-item">
                      <i className="fas fa-check"></i>
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                    </div>
                  ))
                }
                {(!property.amenities || Object.values(property.amenities).every(v => !v)) && (
                  <p style={{ color: '#888' }}>No amenities listed for this property.</p>
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

                <button
                  className={`pay-button`}
                  onClick={handlePayment}
                  disabled={!isConnected || property?.nftMinted !== 'Yes'}
                  style={{ cursor: !isConnected || property?.nftMinted !== 'Yes' ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fas fa-credit-card"></i>
                  Pay Now
                </button>
              </>
            ) : (
              // Only show delete button if current user's email matches builder's email
              (
                <button
                  className="delete-button"
                  onClick={handleDelete}
                >
                  <i className="fas fa-trash"></i> Delete Property
                </button>
              )
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
            contractAddress={NFT_CONTRACT_ADDRESS}
            isSold={isSold}
            propertyTitle={property.title}
            nftMinted={property.nftMinted}
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