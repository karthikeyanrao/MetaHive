import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { db } from './context/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ethers } from 'ethers';
import './BuildingBadge.css';
import { useAuth } from './context/AuthContext';

// Simplified ABI for basic NFT functionality
const NFT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "safeMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function BuildingBadge({ contractAddress, tokenId, isSold, propertyTitle, nftMinted }) {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minting, setMinting] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [mintFormData, setMintFormData] = useState({
    buildingName: '',
    location: '',
    imageUrl: ''
  });
  const [propertyId, setPropertyId] = useState('');
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [mintingContract, setMintingContract] = useState(null);
  const [badgeData, setBadgeData] = useState(null);

  const storage = getStorage();

  // Generate a unique identifier for the property if none is provided
  const propertyIdentifier = `property_${contractAddress}_${tokenId}`;

  // Log the nftMinted status when the component mounts
  useEffect(() => {
   
  }, [nftMinted]); // Dependency array to run effect when nftMinted changes

  // Fetch property details when the component mounts or propertyTitle changes
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true); // Set loading to true while fetching
      try {
        const propertiesCollection = collection(db, 'properties'); // Reference to the properties collection
        const propertyQuery = query(propertiesCollection, where('title', '==', propertyTitle)); // Query to fetch property by title
        const querySnapshot = await getDocs(propertyQuery); // Execute the query
        
        if (!querySnapshot.empty) {
          const propertyDoc = querySnapshot.docs[0].data(); // Get the first document's data
          setPropertyDetails(propertyDoc); // Set the property details in state
          
        } else {
          console.error('No property found with the given title.');
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchPropertyDetails(); // Call the function to fetch property details
  }, [propertyTitle]); // Dependency array to run effect when propertyTitle changes

  // Fetch badge data when component mounts
  useEffect(() => {
    const fetchBadgeData = async () => {
      if (propertyTitle) {  // Changed condition to only check for propertyTitle
        try {
               
          const propertiesCollection = collection(db, 'properties');
          const propertyQuery = query(propertiesCollection, where('title', '==', propertyTitle));
          const querySnapshot = await getDocs(propertyQuery);
          
          if (!querySnapshot.empty) {
            const propertyDoc = querySnapshot.docs[0].data();
           if (propertyDoc.NftMinted === "Yes" && propertyDoc.nftData) {
              const nftData = propertyDoc.nftData;
              setBadgeData({
                tokenId: nftData.tokenId || 'No Token ID',
                mintedBy: nftData.mintedBy || 'No Minter Address',
                mintedAt: nftData.mintedAt || null,
                transactionHash: nftData.transactionHash || 'No Transaction Hash',
                imageUrl: nftData.imageUrl || ''
              });
            } else {
              console.log("NFT not minted or no NFT data available");
              setBadgeData(null);
            }
          } else {
            console.log("No property found with title:", propertyTitle);
          }
        } catch (error) {
          console.error("Error in fetchBadgeData:", error);
        }
      } else {
   
      }
    };
    
    fetchBadgeData();
  }, [propertyTitle]); // Simplified dependency array

  // Add useEffect to log current user details
  useEffect(() => {
    if (currentUser) {
     
      const fetchUserDetails = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
                      }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };

      fetchUserDetails();
    } else {
      console.log("No user is currently signed in");
    }
  }, [currentUser, userRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMintFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };

  const handleShowMintForm = () => {
    setShowMintForm(true); // Set showMintForm to true to display the minting form
  };

  const saveBadgeToFirestore = async (badgeData) => {
    try {
      const badgesRef = collection(db, 'nft_badges');
      const docRef = await addDoc(badgesRef, {
        ...badgeData,
        contractAddress,
        tokenId: tokenId.toString(),
        propertyIdentifier, // Use the generated identifier
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
      return docRef.id;
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      throw error;
    }
  };
  const mintNFT = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    if (!window.ethereum) {
        setError("Ethereum provider not found. Please install MetaMask.");
        return;
    }

    try {
        setMinting(true); // Show minting status
        setError(null);
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
          
        const provider = new BrowserProvider(window.ethereum);
           
        const signer = await provider.getSigner();
              
        const userAddress = await signer.getAddress();

        // Verify contract address
        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("Invalid contract address");
        }

         const contract = new Contract(contractAddress, NFT_ABI, signer);

        // Check network
        const network = await provider.getNetwork();
       

        
        // Calculate 0.5 ETH in wei
        const mintPrice = ethers.parseEther("0.5");
        
        // Add a timeout for the transaction with 0.5 ETH value
        const mintPromise = contract.safeMint(
            userAddress, 
            mintFormData.imageUrl, 
            { value: mintPrice } // Include 0.5 ETH payment
        );
        
        // Set a 2-minute timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction timed out. Check MetaMask.")), 120000)
        );
        
        const tx = await Promise.race([mintPromise, timeoutPromise]);

        const receipt = await tx.wait(); // Wait for confirmation
        
        // Save badge data to Firestore
        const badgeData = {
            buildingName: propertyTitle,
            location: propertyDetails?.location,
            imageUrl: mintFormData.imageUrl,
            mintedBy: userAddress,
            mintedAt: new Date(),
            transactionHash: tx.hash
        };
        
        await saveBadgeToFirestore(badgeData);
        
        // Update property in Firestore to mark as minted
        if (propertyDetails) {
            const propertiesCollection = collection(db, 'properties');
            const propertyQuery = query(propertiesCollection, where('title', '==', propertyTitle));
            const querySnapshot = await getDocs(propertyQuery);
            
            if (!querySnapshot.empty) {
                const propertyDoc = querySnapshot.docs[0];
                const nftData = {
                    imageUrl: mintFormData.imageUrl,
                    transactionHash: tx.hash,
                    mintedBy: userAddress,
                    mintedAt: new Date(),
                    tokenId: tokenId.toString(),
                    contractAddress: contractAddress
                };
                
                await updateDoc(doc(db, 'properties', propertyDoc.id), {
                    NftMinted: "Yes",
                    nftData: nftData
                });
                
                // Update local state to show badge immediately without needing to reload
                setBadgeData(nftData);
                
            }
        }
        
        // Update UI
        setShowMintForm(false);
        
    } catch (error) {
        console.error("Error minting NFT:", error);
        setError("Error minting NFT: " + (error.message || error));
    } finally {
        setMinting(false);
    }
};


  const fetchPropertyData = async () => {
    if (propertyId) {
      try {
        const propertyDoc = await getDoc(doc(db, 'Properties', propertyId));
        if (propertyDoc.exists()) {
          setPropertyData(propertyDoc.data());
          setError(null);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Error fetching property data: ' + err.message);
      }
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId]);

  // Add function to check if user can mint
  const canUserMint = () => {
    return userRole?.toLowerCase() === 'builder';
  };

  return (
    <div className={`building-badge ${isSold ? 'sold-out' : ''}`}>
      {/* Show badge if NFT is minted and we have badge data, otherwise show mint button */}
      {(nftMinted === "Yes" || badgeData) ? (
        <div className="nft-badge">
          <h3>Property NFT Badge</h3>
          <div className="badge-content">
            <div className="badge-image">
              {badgeData?.imageUrl && (
                <img src={badgeData.imageUrl} alt="NFT" className="nft-image" />
              )}
            </div>
            <div className="badge-details">
              <p><strong>Property:</strong> {propertyTitle}</p>
              <p><strong>Location:</strong> {propertyDetails?.location}</p>
              <p><strong>Token ID:</strong> {badgeData?.tokenId || 'N/A'}</p>
              {badgeData?.mintedBy && (
                <p>
                  <strong>Minted by:</strong> 
                  {badgeData.mintedBy === 'No Minter Address' ? 'N/A' : 
                    `${badgeData.mintedBy.substring(0, 8)}...${badgeData.mintedBy.substring(badgeData.mintedBy.length - 6)}`
                  }
                </p>
              )}
              <p>
                <strong>Minted on:</strong> 
                {badgeData?.mintedAt ? 
                  (typeof badgeData.mintedAt === 'object' && 'seconds' in badgeData.mintedAt) ?
                    new Date(badgeData.mintedAt.seconds * 1000).toLocaleDateString() :
                    new Date(badgeData.mintedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
              {badgeData?.transactionHash && badgeData.transactionHash !== 'No Transaction Hash' && (
                <p>
                  <strong>Transaction:</strong> 
                  <a 
                    href={`https://etherscan.io/tx/${badgeData.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {`${badgeData.transactionHash.substring(0, 10)}...`}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Show mint interface only if NFT is not minted, not sold out, AND user is a builder */
        !isSold && canUserMint() && (
          <>
            {!showMintForm ? (
              <div className="mint-section">
                <button 
                  className="mint-button" 
                  onClick={handleShowMintForm}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Mint NFT'}
                </button>
              </div>
            ) : (
              <div className="mint-form-container">
                <form onSubmit={mintNFT} className="mint-form">
                  <h3>Mint New Building Badge </h3>
                  
                  <div style={{  flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginRight: '20px', marginBottom:'10px'}}>Building Name: {propertyTitle}</label>
                    <label style={{ marginRight: '20px', marginBottom:'10px' }}>Location: {propertyDetails?.location}</label>
                    <label style={{ marginRight: '20px', marginBottom:'10px' }}>Area: {propertyDetails?.area} SqFt</label>
                    <label style={{ marginRight: '20px', marginBottom:'10px' }}>Bedrooms: {propertyDetails?.bedrooms}</label>
                    <label style={{ marginRight: '20px' , marginBottom:'10px' }}>Bathrooms: {propertyDetails?.bathrooms}</label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="imageUrl">Image URL (optional):</label>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={mintFormData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Enter image URL"
                    />
                    <small className="form-help">Store all the Property Details in GDRIVE</small>
                  </div>

                  <div className="form-buttons">
                    <button 
                      type="submit" 
                      className="mint-button" 
                      disabled={minting}
                    >
                      {minting ? 'Minting...' : 'Mint Badge '}
                    </button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        setShowMintForm(false);
                        setMinting(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            )}
          </>
        )
      )}

      {/* Show message if user is not authorized to mint */}
      {!isSold && !nftMinted && !canUserMint() && (
        <div className="unauthorized-message">
          <p>Only builders can mint NFTs for properties.</p>
        </div>
      )}

      {isSold && (
        <div className="sold-out-section">
          <div className="sold-out-badge">
            <i className="fas fa-check-circle"></i>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingBadge; 