import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { db } from './context/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ethers } from 'ethers';
import './BuildingBadge.css';
import { useAuth } from './context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// QR Code generation function
const generateQRCode = (text) => {
  const qrSize = 150; // Smaller size for better badge proportion
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(text)}`;
  return qrUrl;
};

// ABI matching the actual RealEstateNFT.sol contract
const NFT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "buildingName", "type": "string" },
      { "internalType": "string", "name": "location", "type": "string" },
      { "internalType": "string", "name": "badgeURI", "type": "string" }
    ],
    "name": "issueBadge",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getBuildingBadge",
    "outputs": [
      { "internalType": "string", "name": "buildingName", "type": "string" },
      { "internalType": "string", "name": "location", "type": "string" },
      { "internalType": "bool", "name": "verificationStatus", "type": "bool" },
      { "internalType": "uint256", "name": "verificationDate", "type": "uint256" },
      { "internalType": "string", "name": "badgeURI", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "buildingName", "type": "string" }
    ],
    "name": "BadgeIssued",
    "type": "event"
  }
];

function BuildingBadge({ contractAddress, isSold, propertyTitle, nftMinted }) {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minting, setMinting] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [mintFormData, setMintFormData] = useState({
    buildingName: '',
    location: ''
  });
  const [propertyId, setPropertyId] = useState('');
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [mintingContract, setMintingContract] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  const storage = getStorage();

  // Generate a unique identifier for the property if none is provided
  const propertyIdentifier = `property_${contractAddress}_${propertyTitle}`;

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

              // Generate QR code if transaction hash exists but QR code is missing
              let qrCodeUrl = nftData.qrCodeUrl;
              if (nftData.transactionHash && nftData.transactionHash !== 'No Transaction Hash' && !qrCodeUrl) {
                setQrCodeLoading(true);
                qrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/${nftData.transactionHash}`);

                // Update Firestore with the generated QR code to persist it
                try {
                  await updateDoc(doc(db, 'properties', querySnapshot.docs[0].id), {
                    'nftData.qrCodeUrl': qrCodeUrl
                  });
                  console.log('QR code saved to Firestore');
                } catch (updateError) {
                  console.error('Error updating QR code in Firestore:', updateError);
                }
              }

              setBadgeData({
                tokenId: nftData.tokenId || 'No Token ID',
                mintedBy: nftData.mintedBy || 'No Minter Address',
                mintedAt: nftData.mintedAt || null,
                transactionHash: nftData.transactionHash || 'No Transaction Hash',
                qrCodeUrl: qrCodeUrl || ''
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

      // DEBUG: confirm what we're minting with
      console.log('=== MINT DEBUG ===');
      console.log('contractAddress from prop:', contractAddress);
      console.log('userAddress (signer):', userAddress);

      // Verify contract address
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid contract address");
      }

      const contract = new Contract(contractAddress, NFT_ABI, signer);

      // Check network
      const network = await provider.getNetwork();

      // Generate QR code for the transaction
      const qrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/`);

      // Call issueBadge matching the actual contract signature
      console.log('Sending issueBadge to contract:', contractAddress);
      const mintPromise = contract.issueBadge(
        userAddress,
        propertyTitle || 'MetaHive Property',
        propertyDetails?.location || 'Unknown Location',
        qrCodeUrl,
        {
          gasLimit: 500000
        }
      );

      // Set a 2-minute timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction timed out. Check MetaMask.")), 120000)
      );

      const tx = await Promise.race([mintPromise, timeoutPromise]);

      const receipt = await tx.wait(); // Wait for confirmation

      // Extract the real tokenId from the transaction receipt logs
      let actualTokenId = "0";
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsedLog && parsedLog.name === 'BadgeIssued') {
            actualTokenId = parsedLog.args[0].toString();
          }
        } catch (e) {
          // ignore parsing errors for other events
        }
      }

      // Generate a distinct UID for this property instead of relying on the sequence
      const shortUid = uuidv4().split('-')[0].toUpperCase();
      const formattedTokenId = `MH-26-${shortUid}`;

      // Generate final QR code with transaction hash
      const finalQrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/${tx.hash}`);

      // Save badge data to Firestore
      const badgeDataToSave = {
        buildingName: propertyTitle,
        location: propertyDetails?.location,
        qrCodeUrl: finalQrCodeUrl,
        mintedBy: userAddress,
        mintedAt: new Date(),
        transactionHash: tx.hash,
        tokenId: formattedTokenId,
        realTokenId: Number(actualTokenId)
      };

      await saveBadgeToFirestore(badgeDataToSave);

      // Update property in Firestore to mark as minted
      if (propertyDetails) {
        const propertiesCollection = collection(db, 'properties');
        const propertyQuery = query(propertiesCollection, where('title', '==', propertyTitle));
        const querySnapshot = await getDocs(propertyQuery);

        if (!querySnapshot.empty) {
          const propertyDoc = querySnapshot.docs[0];
          const nftData = {
            qrCodeUrl: finalQrCodeUrl,
            transactionHash: tx.hash,
            mintedBy: userAddress,
            mintedAt: new Date(),
            tokenId: formattedTokenId,
            realTokenId: Number(actualTokenId),
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


  // fetchPropertyData is handled by the useEffect above that queries by propertyTitle

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
              {(badgeData?.qrCodeUrl || badgeData?.transactionHash) && (
                <div className="qr-code-container">
                  {qrCodeLoading ? (
                    <div className="qr-loading">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Generating QR Code...</span>
                    </div>
                  ) : (
                    <img
                      src={badgeData.qrCodeUrl || generateQRCode(`https://sepolia.etherscan.io/tx/${badgeData.transactionHash}`)}
                      alt="Transaction QR Code"
                      className="qr-code-image"
                      onLoad={() => setQrCodeLoading(false)}
                      onError={() => setQrCodeLoading(false)}
                    />
                  )}

                </div>
              )}
            </div>
            <div className="badge-details">
              <p><strong>Property:</strong> {propertyTitle}</p>
              <p><strong>Location:</strong> {propertyDetails?.location}</p>
              <p><strong>Token ID:</strong> {badgeData?.tokenId || 'N/A'}</p>
              {badgeData?.mintedBy && (
                <p>
                  <strong>Current Owner:</strong>
                  {badgeData.mintedBy === 'No Minter Address' ? 'N/A' :
                    `${badgeData.mintedBy.substring(0, 8)}...${badgeData.mintedBy.substring(badgeData.mintedBy.length - 6)}`
                  }
                </p>
              )}
              <p>
                <strong>Last Updated:</strong>
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
                    href={`https://sepolia.etherscan.io/tx/${badgeData.transactionHash}`}
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

                  <div style={{ flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Building Name: {propertyTitle}</label>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Location: {propertyDetails?.location}</label>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Area: {propertyDetails?.area} SqFt</label>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Bedrooms: {propertyDetails?.bedrooms}</label>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Bathrooms: {propertyDetails?.bathrooms}</label>
                  </div>

                  <div className="form-group">
                    <div className="qr-info">
                      <i className="fas fa-qrcode"></i>
                      <span>QR Code will be automatically generated for transaction verification</span>
                    </div>
                    <small className="form-help">The QR code will link directly to your transaction on Sepolia Etherscan</small>
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