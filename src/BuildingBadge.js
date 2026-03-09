import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { apiGetBadgeByProperty, apiCreateBadge, apiGetPropertyById } from './api';
import { ethers } from 'ethers';
import './BuildingBadge.css';
import { useAuth } from './context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// QR Code generation function
const generateQRCode = (text) => {
  const qrSize = 150;
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

// propertyId  — MongoDB _id of the property (passed from PropertyDetails)
// onMinted   — callback to notify PropertyDetails that minting succeeded
function BuildingBadge({ contractAddress, isSold, propertyTitle, nftMinted, propertyId, onMinted }) {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minting, setMinting] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  // ─── Fetch property details from MongoDB ───────────────────────────────────
  useEffect(() => {
    if (!propertyId) return;
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const docData = await apiGetPropertyById(propertyId);
        if (docData) {
          // DB may be flat (top-level fields) or nested (under propertyDetails).
          // Merge both so fields like address, area, bedrooms are always available.
          const nested = docData.propertyDetails || {};
          setPropertyDetails({
            ...nested,
            // flat fields win if nested is empty
            location: nested.location || docData.location || docData.address || '',
            address: nested.address || docData.address || '',
            area: nested.area || docData.area || '',
            bedrooms: nested.bedrooms || docData.bedrooms || '',
            bathrooms: nested.bathrooms || docData.bathrooms || '',
            NftMinted: nested.NftMinted || docData.NftMinted || 'No',
            builderId: docData.builderId,
          });
        } else {
          console.error('No property found with the given id:', propertyId);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [propertyId]);

  // ─── Fetch existing badge data from MongoDB ────────────────────────────────
  useEffect(() => {
    if (!propertyId) return;
    const fetchBadgeData = async () => {
      try {
        const docData = await apiGetPropertyById(propertyId);
        if (!docData) return;

        // NftMinted lives as a flat field on the doc (not inside propertyDetails)
        const pDetails = docData.propertyDetails || {};
        const mintedFlag = docData.NftMinted || pDetails.NftMinted;
        const bId = docData.builderId;

        // Update propertyDetails to ensure builderId is available for canUserMint
        setPropertyDetails(prev => ({ ...prev, builderId: bId }));

        console.log('[BuildingBadge] propertyId:', propertyId);
        console.log('[BuildingBadge] NftMinted (flat):', docData.NftMinted, '| (nested):', pDetails.NftMinted, '=> resolved:', mintedFlag);

        if (mintedFlag === 'Yes') {
          // ── Try dedicated badge collection first ─────────────────────────
          try {
            const badge = await apiGetBadgeByProperty(propertyId);
            console.log('[BuildingBadge] Badge fetched from /badges/property:', badge);
            if (badge) {
              let qrCodeUrl = badge.qrCodeUrl;
              if (badge.transactionHash && badge.transactionHash !== 'No Transaction Hash' && !qrCodeUrl) {
                qrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/${badge.transactionHash}`);
              }
              setBadgeData({
                tokenId: badge.tokenId || 'No Token ID',
                mintedBy: badge.mintedBy || 'No Minter Address',
                mintedAt: badge.mintedAt || null,
                transactionHash: badge.transactionHash || 'No Transaction Hash',
                qrCodeUrl: qrCodeUrl || ''
              });
              return;
            }
          } catch (badgeErr) {
            console.warn('[BuildingBadge] Badge endpoint error (falling back to nftData):', badgeErr.message);
          }

          // ── Fallback: read nftData embedded directly on the property ─────
          const nftData = docData.nftData || pDetails.nftData;
          console.log('[BuildingBadge] nftData fallback:', nftData);
          if (nftData) {
            let qrCodeUrl = nftData.qrCodeUrl;
            if (nftData.transactionHash && !qrCodeUrl) {
              qrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/${nftData.transactionHash}`);
            }
            setBadgeData({
              tokenId: nftData.tokenId || 'No Token ID',
              mintedBy: nftData.mintedBy || 'No Minter Address',
              mintedAt: nftData.mintedAt || null,
              transactionHash: nftData.transactionHash || 'No Transaction Hash',
              qrCodeUrl: qrCodeUrl || ''
            });
          } else {
            console.warn('[BuildingBadge] NftMinted=Yes but no badge or nftData found on property.');
            setBadgeData(null);
          }
        } else {
          console.log('[BuildingBadge] NftMinted is not Yes — showing mint button.');
          setBadgeData(null);
        }
      } catch (error) {
        console.error('Error in fetchBadgeData:', error);
      }
    };
    fetchBadgeData();
  }, [propertyId]);

  // ─── Mint NFT ──────────────────────────────────────────────────────────────
  const mintNFT = async (e) => {
    e.preventDefault();

    if (!window.ethereum) {
      setError('Ethereum provider not found. Please install MetaMask.');
      return;
    }

    if (!propertyId) {
      setError('Property ID is missing. Cannot mint NFT.');
      return;
    }

    try {
      setMinting(true);
      setError(null);

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log('=== MINT DEBUG ===');
      console.log('propertyId:', propertyId);
      console.log('contractAddress:', contractAddress);
      console.log('userAddress (signer):', userAddress);

      // Verify contract address
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address');
      }

      const contract = new Contract(contractAddress, NFT_ABI, signer);

      // Generate placeholder QR code (final one uses tx hash)
      const qrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/`);

      // Call issueBadge — matches the actual RealEstateNFT.sol signature
      console.log('Sending issueBadge to contract:', contractAddress);
      const mintPromise = contract.issueBadge(
        userAddress,
        propertyTitle || 'MetaHive Property',
        propertyDetails?.location || propertyDetails?.address || 'Unknown Location',
        qrCodeUrl,
        { gasLimit: 500000 }
      );

      // 2-minute timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction timed out. Check MetaMask.')), 120000)
      );

      const tx = await Promise.race([mintPromise, timeoutPromise]);
      const receipt = await tx.wait();

      // Extract the real on-chain tokenId from BadgeIssued event logs
      let actualTokenId = '0';
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsedLog && parsedLog.name === 'BadgeIssued') {
            actualTokenId = parsedLog.args[0].toString();
          }
        } catch (_) { /* ignore other events */ }
      }

      // Human-readable formatted token ID
      const shortUid = uuidv4().split('-')[0].toUpperCase();
      const formattedTokenId = `MH-26-${shortUid}`;

      // Final QR code with real tx hash
      const finalQrCodeUrl = generateQRCode(`https://sepolia.etherscan.io/tx/${tx.hash}`);

      // ── 1. Save badge record to MongoDB via API ──────────────────────────
      await apiCreateBadge({
        propertyId,
        contractAddress,
        buildingName: propertyTitle,
        location: propertyDetails?.location || propertyDetails?.address || 'Unknown Location',
        qrCodeUrl: finalQrCodeUrl,
        mintedBy: userAddress,
        mintedAt: new Date().toISOString(),
        transactionHash: tx.hash,
        tokenId: formattedTokenId,
        realTokenId: Number(actualTokenId)
      });

      // ── apiCreateBadge (POST /api/badges) already handles:
      //    • saving the badge record
      //    • updating NftMinted = 'Yes' and nftData on the property
      // So NO separate apiUpdateProperty call is needed here.

      // ── 3. Update local UI state immediately ─────────────────────────────
      setBadgeData({
        tokenId: formattedTokenId,
        mintedBy: userAddress,
        mintedAt: new Date(),
        transactionHash: tx.hash,
        qrCodeUrl: finalQrCodeUrl,
        realTokenId: Number(actualTokenId)
      });

      setShowMintForm(false);

      // ── 4. Notify parent so Pay Now button enables instantly ──────────────
      if (typeof onMinted === 'function') {
        onMinted();
      }

    } catch (error) {
      console.error('Error minting NFT:', error);
      setError('Error minting NFT: ' + (error.message || error));
    } finally {
      setMinting(false);
    }
  };

  const handleShowMintForm = () => setShowMintForm(true);

  const canUserMint = () => {
    const isOwner = currentUser?.uid === propertyDetails?.builderId;
    const isBuilderRole = userRole?.toLowerCase() === 'builder';
    return isBuilderRole && isOwner;
  };

  return (
    <div className={`building-badge ${isSold ? 'sold-out' : ''}`}>
      {/* Show badge if NFT is minted and we have badge data, otherwise show mint button */}
      {(nftMinted === 'Yes' || badgeData) ? (
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
              <p><strong>Location:</strong> {propertyDetails?.location || propertyDetails?.address}</p>
              <p><strong>Token ID:</strong> {badgeData?.tokenId || 'N/A'}</p>
              {badgeData?.mintedBy && (
                <p>
                  <strong>Current Owner:</strong>{' '}
                  {badgeData.mintedBy === 'No Minter Address' ? 'N/A' :
                    `${badgeData.mintedBy.substring(0, 8)}...${badgeData.mintedBy.substring(badgeData.mintedBy.length - 6)}`
                  }
                </p>
              )}
              <p>
                <strong>Last Updated:</strong>{' '}
                {badgeData?.mintedAt
                  ? (typeof badgeData.mintedAt === 'object' && 'seconds' in badgeData.mintedAt)
                    ? new Date(badgeData.mintedAt.seconds * 1000).toLocaleDateString()
                    : new Date(badgeData.mintedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
              {badgeData?.transactionHash && badgeData.transactionHash !== 'No Transaction Hash' && (
                <p>
                  <strong>Transaction:</strong>{' '}
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
        /* Show mint interface only if not sold AND user is a builder */
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
                  <h3>Mint New Building Badge</h3>

                  <div style={{ flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Building Name: {propertyTitle}</label>
                    <label style={{ marginRight: '20px', marginBottom: '10px' }}>Location: {propertyDetails?.location || propertyDetails?.address}</label>
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
                    <button type="submit" className="mint-button" disabled={minting}>
                      {minting ? 'Minting...' : 'Mint Badge'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => { setShowMintForm(false); setMinting(false); setError(null); }}
                    >
                      Cancel
                    </button>
                  </div>

                  {error && <div className="error-message">{error}</div>}
                </form>
              </div>
            )}
          </>
        )
      )}

      {/* Message if user is not authorized to mint */}
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