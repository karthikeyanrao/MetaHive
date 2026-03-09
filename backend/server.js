require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const verifyToken = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Models
const User = require('./models/User');
const Property = require('./models/Property');
const Badge = require('./models/Badge');
const Purchase = require('./models/Purchase');

// ============================================================
// 1. USERS
// ============================================================

// GET /api/users/me - Retrieve own profile
app.get('/api/users/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users - Create new profile (called after Firebase Auth signup)
app.post('/api/users', verifyToken, async (req, res) => {
    try {
        const { email, fullName, phone, userType, role, builderName, companyName, address,
            aadharId, panNumber, annualIncome, licenseNumber, licenseImage, aadharProof } = req.body;

        let user = await User.findOne({ uid: req.user.uid });
        if (user) return res.status(400).json({ error: 'User profile already exists' });

        user = new User({
            uid: req.user.uid,
            email,
            fullName,
            phone,
            userType: userType || role,   // accept both field names
            role: role || userType,
            builderName,
            companyName,
            address,
            aadharId,
            panNumber,
            annualIncome,
            licenseNumber,
            licenseImage,
            aadharProof
        });

        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:uid - Retrieve public profile of a user (e.g., Builder info on property page)
app.get('/api/users/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            name: user.fullName || user.builderName,
            email: user.email,
            phone: user.phone
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/me - Update own profile
app.put('/api/users/me', verifyToken, async (req, res) => {
    try {
        const updateData = req.body;
        delete updateData.uid; // prevent overriding uid

        const user = await User.findOneAndUpdate(
            { uid: req.user.uid },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 2. PROPERTIES
// ============================================================

// GET /api/properties - All listed properties, including sold (filtered by frontend toggle)
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await Property.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/properties/builder/me - Properties created by the logged-in builder
app.get('/api/properties/builder/me', verifyToken, async (req, res) => {
    try {
        const properties = await Property.find({ builderId: req.user.uid }).sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/properties/:id - Get specific property
app.get('/api/properties/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json(property);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/properties - Create a new property listing
app.post('/api/properties', verifyToken, async (req, res) => {
    try {
        const propertyData = req.body;
        propertyData.builderId = req.user.uid;  // enforce from token

        const property = new Property(propertyData);
        await property.save();
        res.status(201).json(property);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/properties/:id - Update property listing
// Builders can always update their own properties.
// The system (via verifyToken) can update any field including NftMinted, nftData, buyerId, status.
// We allow the builder to update all fields. The purchase endpoint handles buyer-side updates internally.
app.put('/api/properties/:id', verifyToken, async (req, res) => {
    try {
        const property = await Property.findOneAndUpdate(
            { _id: req.params.id, builderId: req.user.uid },
            { $set: req.body },
            { new: true }
        );
        if (!property) return res.status(404).json({ error: 'Property not found or unauthorized' });
        res.json(property);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/properties/:id - Delete property listing (builder only)
app.delete('/api/properties/:id', verifyToken, async (req, res) => {
    try {
        console.log(`[DELETE] User ${req.user.uid} attempting to delete property ${req.params.id}`);
        const property = await Property.findOneAndDelete({ _id: req.params.id, builderId: req.user.uid });
        if (!property) {
            console.log(`[DELETE] Property ${req.params.id} not found or user ${req.user.uid} is not the owner.`);
            return res.status(404).json({ error: 'Property not found or unauthorized' });
        }
        console.log(`[DELETE] Property ${req.params.id} deleted successfully.`);
        res.json({ message: 'Property deleted successfully' });
    } catch (err) {
        console.error(`[DELETE] Error deleting property ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 3. BADGES (NFT)
// Note: Only ONE POST /api/badges route — fixed duplicate bug.
// ============================================================

// GET /api/badges/builder/me - badges for logged-in builder
app.get('/api/badges/builder/me', verifyToken, async (req, res) => {
    try {
        const badges = await Badge.find({ builderId: req.user.uid }).sort({ createdAt: -1 });
        res.json(badges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/badges/property/:propertyId - Get badge for a specific property
app.get('/api/badges/property/:propertyId', async (req, res) => {
    try {
        const badge = await Badge.findOne({ propertyId: req.params.propertyId });
        if (!badge) return res.status(404).json({ error: 'Badge not found' });
        res.json(badge);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/badges - Mint a badge AND update NftMinted on the property (builder only)
app.post('/api/badges', verifyToken, async (req, res) => {
    try {
        const {
            propertyId,
            contractAddress,
            buildingName,
            location,
            tokenId,
            realTokenId,
            mintedBy,
            mintedAt,
            transactionHash,
            qrCodeUrl
        } = req.body;

        // ── Debug: log what we're searching for ──────────────────────────────
        console.log('[BADGE MINT] propertyId from body :', propertyId);
        console.log('[BADGE MINT] req.user.uid from token:', req.user.uid);

        // Step 1: verify property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            console.error('[BADGE MINT] Property not found for id:', propertyId);
            return res.status(404).json({ error: 'Property not found' });
        }

        console.log('[BADGE MINT] property.builderId in DB:', property.builderId);

        // Step 2: verify the logged-in user is the builder OF this property
        if (property.builderId !== req.user.uid) {
            console.error('[BADGE MINT] Unauthorized: property.builderId =', property.builderId, '!= req.user.uid =', req.user.uid);
            return res.status(403).json({ error: 'Unauthorized: only the property builder can mint an NFT' });
        }


        // Save badge record
        const badge = new Badge({
            propertyId,
            buildingName,
            location,
            contractAddress,
            tokenId,
            mintedBy,
            mintedAt,
            transactionHash,
            qrCodeUrl,
            builderId: req.user.uid
        });
        await badge.save();

        // Update property: set NftMinted = 'Yes' and store full nftData
        await Property.findByIdAndUpdate(propertyId, {
            $set: {
                NftMinted: 'Yes',
                nftData: {
                    qrCodeUrl,
                    transactionHash,
                    mintedBy,
                    mintedAt: mintedAt || new Date().toISOString(),
                    tokenId,
                    realTokenId: realTokenId || 0,
                    contractAddress
                }
            }
        });

        res.status(201).json(badge);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/badges/:id - Update badge (e.g. transfer owner after purchase)
app.put('/api/badges/:id', verifyToken, async (req, res) => {
    try {
        const badge = await Badge.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!badge) return res.status(404).json({ error: 'Badge not found' });
        res.json(badge);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 4. PURCHASES
// When a buyer completes payment, this creates the purchase record
// AND updates property status + NFT ownership.
// ============================================================

// GET /api/purchases/me - Get purchases for logged-in buyer
app.get('/api/purchases/me', verifyToken, async (req, res) => {
    try {
        const purchases = await Purchase.find({ buyerId: req.user.uid })
            .populate('propertyId')
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/purchases - Record a purchase and update property + NFT badge ownership
app.post('/api/purchases', verifyToken, async (req, res) => {
    try {
        const {
            propertyId,
            builderId,
            amount,
            transactionHash,
            buyerAddress,   // on-chain buyer wallet (MetaMask address)
            buyerName       // display name of buyer
        } = req.body;

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ error: 'Property not found' });

        // Create purchase record
        const purchase = new Purchase({
            propertyId,
            buyerId: req.user.uid,
            builderId: builderId || property.builderId,
            amount,
            transactionHash
        });
        await purchase.save();

        // ── Update property: mark sold + record buyer details + transfer NFT ownership ──
        const prevNftData = property.nftData || {};
        const updatedNftData = {
            ...prevNftData,
            // Transfer NFT: new on-chain owner is the buyer
            mintedBy: buyerAddress || prevNftData.mintedBy,
            previousOwner: prevNftData.mintedBy,
            transactionHash: transactionHash || prevNftData.transactionHash,
            purchaseDate: new Date().toISOString()
        };

        await Property.findByIdAndUpdate(propertyId, {
            $set: {
                status: 'sold',
                isSold: 'Yes',
                buyerId: req.user.uid,
                buyerName: buyerName || '',
                buyerAddress: buyerAddress || '',
                soldAt: new Date().toISOString(),
                nftData: updatedNftData,
                // Persist the ownership chain
                $push: {
                    ownershipLog: {
                        from: prevNftData.mintedBy || property.builderId,
                        to: buyerAddress,
                        transactionHash: transactionHash,
                        date: new Date().toISOString(),
                        amountUsd: amount
                    }
                }
            }
        });

        // ── Update Badge: change mintedBy to buyer wallet ──
        await Badge.findOneAndUpdate(
            { propertyId },
            {
                $set: {
                    mintedBy: buyerAddress || '',
                    transactionHash: transactionHash || ''
                }
            }
        );

        res.status(201).json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// Connect to MongoDB & Start Server
// ============================================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });
