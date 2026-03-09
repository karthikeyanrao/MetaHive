const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() }, // Override default ObjectId to accept Firebase string IDs
    uid: { type: String, required: true }, // Should match 'userId' in some docs
    userId: { type: String }, // For old docs
    email: { type: String, required: true },
    name: { type: String }, // Old firebase field
    fullName: { type: String }, // New field
    phone: { type: String, required: true },
    role: { type: String }, // Old firebase field
    userType: { type: String, enum: ['buyer', 'builder', 'Buyer', 'Builder'] },
    
    // Buyer specific profile
    profileImage: { type: String, default: '' }, // IPFS link
    aadharId: { type: String },
    panNumber: { type: String },
    annualIncome: { type: Number }, // Buyer specific
    address: { type: String }, // Buyer/Builder
    aadharProof: { type: String }, // Buyer specific (IPFS path)
    
    // Builder Registration details
    builderName: { type: String },
    companyName: { type: String },
    licenseNumber: { type: String }, // Builder specific
    licenseImage: { type: String }, // Builder specific (IPFS path)
    reraStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isApproved: { type: Boolean, default: false }, // Admin approval for builders
    registrationDate: { type: String } // from old firebase
}, { timestamps: true, collection: 'users' });

module.exports = mongoose.model('User', userSchema);
