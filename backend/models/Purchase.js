const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const purchaseSchema = new Schema({
    buyerId: { type: String, required: true }, // Firebase UID of the buyer
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    builderId: { type: String, required: true },
    
    amount: { type: Number, required: true }, // Either ETH or USD
    transactionHash: { type: String }, // Optional, if bought via Ethereum/smart contract
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    
    purchaseDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
