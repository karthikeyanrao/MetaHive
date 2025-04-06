import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import './BadgeGallery.css';

const NFT_ABI = [
  "function totalSupply() public view returns (uint256)",
  "function tokenByIndex(uint256 index) public view returns (uint256)",
  "function getBuildingBadge(uint256 tokenId) public view returns (string memory buildingName, string memory location, bool verificationStatus, uint256 verificationDate, string memory badgeURI)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

function BadgeGallery({ contractAddress }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const nftContract = new Contract(contractAddress, NFT_ABI, provider);

        // Get total supply
        const totalSupply = await nftContract.totalSupply();
        console.log('Total supply:', totalSupply.toString());

        // Fetch all badges
        const badgePromises = [];
        for (let i = 0; i < Number(totalSupply); i++) {
          badgePromises.push(fetchBadgeDetails(nftContract, i));
        }

        const badgeDetails = await Promise.all(badgePromises);
        setBadges(badgeDetails.filter(badge => badge !== null));
        setError(null);
      } catch (error) {
        console.error("Error fetching badges:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [contractAddress]);

  const fetchBadgeDetails = async (contract, tokenId) => {
    try {
      const details = await contract.getBuildingBadge(tokenId);
      const owner = await contract.ownerOf(tokenId);
      
      return {
        tokenId,
        buildingName: details[0],
        location: details[1],
        isVerified: details[2],
        verificationDate: new Date(Number(details[3]) * 1000),
        badgeURI: details[4],
        owner
      };
    } catch (error) {
      console.error(`Error fetching badge ${tokenId}:`, error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="badge-gallery-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading badges...
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge-gallery-error">
        <i className="fas fa-exclamation-circle"></i>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="badge-gallery">
      <h2>MetaHive Property Badges</h2>
      <div className="badge-grid">
        {badges.length === 0 ? (
          <div className="no-badges">
            <i className="fas fa-certificate"></i>
            <p>No badges minted yet</p>
          </div>
        ) : (
          badges.map(badge => (
            <div key={badge.tokenId} className="badge-card">
              <div className="badge-card-image">
                <img 
                  src={badge.badgeURI} 
                  alt={badge.buildingName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=MetaHive+Badge';
                  }}
                />
              </div>
              <div className="badge-card-content">
                <h3>{badge.buildingName}</h3>
                <p><i className="fas fa-map-marker-alt"></i> {badge.location}</p>
                <p><i className="fas fa-calendar-check"></i> {badge.verificationDate.toLocaleDateString()}</p>
                <p className="badge-owner">
                  <i className="fas fa-user"></i> 
                  {badge.owner.slice(0, 6)}...{badge.owner.slice(-4)}
                </p>
                <div className={`badge-status ${badge.isVerified ? 'verified' : 'unverified'}`}>
                  <i className={`fas fa-${badge.isVerified ? 'check-circle' : 'times-circle'}`}></i>
                  {badge.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BadgeGallery;