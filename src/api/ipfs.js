import axios from 'axios';

// Pinata API Keys from environment
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;

// Base url for uploading files to IPFS via Pinata
const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

/**
 * Uploads a file (like an image) directly to IPFS via Pinata
 * @param {File | Blob} file 
 * @returns {string} The IPFS Gateway URL
 */
export const uploadFileToIPFS = async (file) => {
    if (!PINATA_API_KEY) {
        throw new Error("Missing Pinata API Keys");
    }
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await axios.post(PINATA_URL, formData, {
            headers: {
                'Content-Type': `multipart/form-data;`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });

        // Return a standard IPFS gateway url to the file
        return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw error;
    }
};

/**
 * Uploads JSON metadata to IPFS via Pinata
 * @param {Object} jsonData 
 * @returns {string} The IPFS Gateway URL
 */
export const uploadJSONToIPFS = async (jsonData) => {
    try {
        const res = await axios.post(PINATA_JSON_URL, jsonData, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
        console.error("Error uploading JSON to IPFS:", error);
        throw error;
    }
};
