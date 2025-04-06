import React, { useState, useEffect } from "react";
import "./PropertyDetails.css";
import home from "./home.png";
import ThreeBackground from './ThreeBackground';
import { ethers } from 'ethers';
import { useWeb3 } from './context/Web3Context';
import { SENDER_ADDRESS, SENDER_ABI } from './contracts/SenderContract';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "./context/firebase"; // Ensure db is properly exported
import { doc, deleteDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";  
import BuildingBadge from './BuildingBadge';
import PropertyReceipt from './receipt';  

import b1 from './b1.jpg';
import b2 from './b2.jpg';
import be1 from './be1.jpg';
import k1 from './k1.jpg';


function PropertyDetails() {
  const [showAgentPopup, setShowAgentPopup] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const { isConnected, account, currentUser } = useWeb3();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isSold, setIsSold] = useState(() => {
    return localStorage.getItem(`property_${id}_sold`) === 'true'
  });
  const [property, setProperty] = useState({});
  const NFT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const toggleAgentPopup = () => {
    setShowAgentPopup(!showAgentPopup);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        // Query to find the property by ID
        const propertiesCollection = collection(db, 'properties');
        const q = query(propertiesCollection, where('id', '==', id)); // Query by ID
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const propertyDoc = querySnapshot.docs[0].ref; // Get the document reference
          
          // Delete the property document
          await deleteDoc(propertyDoc);
          alert('Property deleted successfully!');
          navigate('/properties');
          window.scrollTo(0, 0);
        } else {
          alert('Property not found.'); // Handle case where property does not exist
        }
      } catch (error) {
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  // Rest of your existing constants (images, features, amenities)
  const images = [
    { id: 1, url:be1 , alt: "Living Room" },
    { id: 2, url:k1 , alt: "Kitchen" },
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
        alert('Please connect your wallet first');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const senderContract = new ethers.Contract(
        SENDER_ADDRESS,
        SENDER_ABI,
        signer
      );

      const amountToSend = ethers.parseEther("2.0");
      setPaymentStatus('Processing payment...');

      const tx = await senderContract.sendEther({ value: amountToSend });
      await tx.wait();

      // Update Firebase status
      const propertiesCollection = collection(db, 'properties');
      const q = query(propertiesCollection, where('id', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const propertyDoc = querySnapshot.docs[0].ref;
        await updateDoc(propertyDoc, { isSold: 'Sold' });
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
          contractAddress: SENDER_ADDRESS,
          senderAddress: account,
          receiverAddress: SENDER_ADDRESS
        };

        setReceiptData(receiptInfo);
        setShowReceipt(true);
        setPaymentStatus('');
      }
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
            // Add these builder details
            builderName: propertyDetails.builderName || 'Not available',
            builderEmail: propertyDetails.builderEmail || 'Not available',
            builderId: propertyDetails.builderId,
            buildingDescription: propertyDetails.buildingDescription,
            // Add coordinates if available
            latitude: propertyDetails.latitude || 'N/A',
            longitude: propertyDetails.longitude || 'N/A'
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
      console.log('Checking currentUser:', currentUser); // Debug log 1

      if (currentUser) {
        try {
          // Get the current user's document
          const userRef = doc(db, 'Users', currentUser.uid);
          console.log('Fetching user document for UID:', currentUser.uid); // Debug log 2

          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('Found user data:', userData); // Debug log 3
            console.log('Builder email:', property.builderEmail); // Debug log 4
            
            setCurrentUserEmail(userData.email);
            
          
          } else {
            console.log('No user document found for:', currentUser.uid); // Debug error 1
          }
        } catch (error) {
          console.error('Error fetching current user:', error); // Debug error 2
        }
      } else {
        console.log('No currentUser available'); // Debug error 3
      }
    };

    fetchCurrentUserDetails();
  }, [currentUser, property.builderEmail]); // Added property.builderEmail as dependency
  

  return (
    <>
      <ThreeBackground />
      <div className={`property-details ${isSold ? 'sold-out' : ''}`}>
        <div className="property-header">
          <div className="header-content">
            <h1 className="property-title">{property.title}</h1>
            <div className="property-meta">
              <div className="property-location">
                <i className="fas fa-map-marker-alt"></i>
                {property.location}
              </div>
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
                className={`thumbnail ${
                  selectedImage === image.url ? "active" : ""
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
              <p>
                Experience luxury living at its finest in this stunning penthouse
                suite. Featuring breathtaking city views, premium finishes, and
                state-of-the-art amenities, this property represents the pinnacle
                of urban sophistication.
              </p>
              <div className="highlights">
                <h3>Property Highlights</h3>
                <ul>
                  <li>Floor-to-ceiling windows with panoramic views</li>
                  <li>Custom Italian kitchen with premium appliances</li>
                  <li>Private elevator access</li>
                  <li>Smart home automation system</li>
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
                {amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <i className="fas fa-check"></i>
                    <span>{amenity}</span>
                  </div>
                ))}
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
        onClick={() => window.open("https://cal.com/subhashini-s-m-kecyon", "_blank")}
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
            tokenId={0}
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
    </>
  );
}

export default PropertyDetails;