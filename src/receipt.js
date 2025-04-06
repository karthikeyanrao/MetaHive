import { ethers } from 'ethers';
import html2pdf from 'html2pdf.js';

export class PropertyReceipt {
    constructor(transactionData) {
        this.builderName = transactionData.builderName;
        this.builderEmail = transactionData.builderEmail;
        this.buyerName = transactionData.buyerName;
        this.buyerAddress = transactionData.buyerAddress;
        this.propertyDetails = transactionData.propertyDetails;
        this.amountPaid = transactionData.amountPaid;
    
        this.transactionHash = transactionData.transactionHash;
        this.date = new Date();
        this.contractAddress = transactionData.contractAddress;
        this.senderAddress = transactionData.senderAddress;
        this.receiverAddress = transactionData.receiverAddress;
    }

    generateHTMLReceipt() {
        return `
            <div class="property-receipt">
                <div class="receipt-header">
                    <h2>PROPERTY PURCHASE RECEIPT</h2>
                    <p class="timestamp">Date: ${this.date.toLocaleString()}</p>
                </div>

                <div class="builder-details section">
                    <h3>Builder Information</h3>
                    <p><strong>Name:</strong> ${this.builderName}</p>
                    <p><strong>Email:</strong> ${this.builderEmail}</p>
                    <p><strong>Builder ID:</strong> ${this.propertyDetails.builderId}</p>
                </div>

                <div class="buyer-details section">
                    <h3>Buyer Information</h3>
                    <p><strong>Name:</strong> ${this.buyerName}</p>
                    <p><strong>Wallet Address:</strong> ${this.buyerAddress}</p>
                </div>

                <div class="property-details section">
                    <h3>Property Information</h3>
                    <p><strong>Title:</strong> ${this.propertyDetails.title}</p>
                    <p><strong>Location:</strong> ${this.propertyDetails.location}</p>
                    <p><strong>Area:</strong> ${this.propertyDetails.area} sq ft</p>
                    <p><strong>Price:</strong> ${this.propertyDetails.price} ETH</p>
                    <p><strong>Building Description:</strong> ${this.propertyDetails.buildingDescription}</p>
                    <p><strong>Area:</strong> ${this.propertyDetails.area} sq ft</p>
                    <p><strong>Bedrooms:</strong> ${this.propertyDetails.bedrooms}</p>
                    <p><strong>Bathrooms:</strong> ${this.propertyDetails.bathrooms}</p>
                    <p><strong>Furnished Status:</strong> ${this.propertyDetails.furnishedStatus}</p>
                    <p><strong>NFT Status:</strong> ${this.propertyDetails.nftMinted}</p>      
                                  </div>

                <div class="transaction-details section">
                    <h3>Transaction Information</h3>
                    <p><strong>Amount Paid:</strong> ${this.amountPaid} ETH</p>
                    <p><strong>Transaction Hash:</strong> ${this.transactionHash}</p>
                    <p><strong>Contract Address:</strong> ${this.contractAddress}</p>
                    <p><strong>Sender Address:</strong> ${this.senderAddress}</p>
                    <p><strong>Receiver Address:</strong> ${this.receiverAddress}</p>
                </div>

                <div class="receipt-footer">
                    <p class="thank-you">Thank you for your purchase!</p>
                </div>
            </div>`;
    }

    async downloadPDF() {
        const element = document.createElement('div');
        element.innerHTML = this.generateHTMLReceipt();
        
        const opt = {
            margin: 1,
            filename: `property-receipt-${this.date.getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
    }
}

export default PropertyReceipt; 