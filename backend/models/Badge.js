const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const badgeSchema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    propertyId: { type: String }, // New schema links to propertyId
    propertyIdentifier: { type: String }, // Old schema identifier
    buildingName: { type: String },
    location: { type: String },
    contractAddress: { type: String },
    tokenId: { type: String },
    mintedBy: { type: String },
    transactionHash: { type: String },
    qrCodeUrl: { type: String },
    mintedAt: { type: String },
    createdAt: { type: String },
    updatedAt: { type: String },
    builderId: { type: String },   // Firebase UID of the builder who minted
    realTokenId: { type: Number }    // Actual on-chain integer tokenId
}, { timestamps: true, collection: 'nft' });

module.exports = mongoose.model('Badge', badgeSchema);
