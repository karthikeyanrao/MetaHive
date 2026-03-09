const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const propertySchema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    builderId: { type: String, required: true },
    buyerId: { type: String },
    isSold: { type: String, default: 'No' },

    // Support flat structure from Firebase
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    address: { type: String },
    location: { type: String },
    type: { type: String },
    images: { type: mongoose.Schema.Types.Mixed },
    amenities: { type: mongoose.Schema.Types.Mixed },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    area: { type: Number },
    NftMinted: { type: String, default: 'No' },
    rawMaterials: { type: String },
    buildingDescription: { type: String },
    details: { type: String },
    furnishedStatus: { type: String },

    // Support nested structure (our new format)
    propertyDetails: {
        title: { type: String },
        description: { type: String },
        price: { type: Number },
        address: { type: String },
        location: {
            lat: { type: Number },
            lng: { type: Number }
        },
        type: { type: String },
        images: { type: mongoose.Schema.Types.Mixed },
        amenities: { type: mongoose.Schema.Types.Mixed },
        bedrooms: { type: Number },
        bathrooms: { type: Number },
        area: { type: Number },
        NftMinted: { type: String, default: 'No' },
        rawMaterials: { type: String },
        buildingDescription: { type: String },
        details: { type: String },
        furnishedStatus: { type: String }
    },

    // NFT Data mappings
    nftData: { type: mongoose.Schema.Types.Mixed },

    buyerName: { type: String },
    builderName: { type: String },
    buyerAddress: { type: String },
    builderEmail: { type: String },
    soldAt: { type: String },
    ownershipLog: { type: mongoose.Schema.Types.Mixed, default: [] },

    isSold: { type: String },
    status: { type: String, enum: ['draft', 'listed', 'sold', 'Sold'], default: 'listed' },
    createdAt: { type: String }, // Old DB uses string dates sometimes
}, { timestamps: true, collection: 'properties' });

module.exports = mongoose.model('Property', propertySchema);
