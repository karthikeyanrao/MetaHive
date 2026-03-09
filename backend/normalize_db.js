require('dotenv').config();
const mongoose = require('mongoose');

// Import Schemas
const User = require('./models/User');
const Property = require('./models/Property');
const Badge = require('./models/Badge');

async function normalizeData() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully!");

        console.log("--- Normalizing Users ---");
        const users = await User.find({});
        let userUpdates = 0;
        for (let user of users) {
             let changed = false;
             
             // Map userId -> uid
             if (user.userId && !user.uid) {
                 user.uid = user.userId;
                 changed = true;
             }
             
             // Map name -> fullName
             if (user.name && !user.fullName) {
                 user.fullName = user.name;
                 changed = true;
             }
             
             // Map role -> userType
             if (user.role && !user.userType) {
                 user.userType = user.role.toLowerCase();
                 changed = true;
             }
             
             if (changed) {
                 await user.save();
                 userUpdates++;
             }
        }
        console.log(`Normalized ${userUpdates} User profiles.`);

        console.log("--- Normalizing Properties ---");
        const properties = await Property.find({});
        let propUpdates = 0;
        for (let prop of properties) {
            let changed = false;
            
            // Map flat data into propertyDetails
            if (!prop.propertyDetails || !prop.propertyDetails.title) {
                prop.propertyDetails = {
                    title: prop.title || "Untitled Property",
                    description: prop.buildingDescription || prop.description || "No description",
                    price: prop.price || 0,
                    address: prop.location || prop.address || "No address",
                    type: "apartment", // generic fallback
                    bedrooms: prop.bedrooms,
                    bathrooms: prop.bathrooms,
                    area: prop.area,
                    rawMaterials: prop.rawMaterials,
                    buildingDescription: prop.buildingDescription,
                    details: prop.details
                };
                
                // robust amenities handling (firebase object to array)
                if (prop.amenities && !Array.isArray(prop.amenities)) {
                    prop.propertyDetails.amenities = Object.keys(prop.amenities).filter(k => prop.amenities[k] === true || prop.amenities[k] === "true");
                } else if (Array.isArray(prop.amenities)) {
                    prop.propertyDetails.amenities = prop.amenities;
                } else {
                    prop.propertyDetails.amenities = [];
                }
                
                // robust images handling
                if (prop.images && typeof prop.images === 'string') {
                    prop.propertyDetails.images = [prop.images];
                } else if (Array.isArray(prop.images)) {
                    prop.propertyDetails.images = prop.images.filter(img => typeof img === 'string'); // ignore garbage
                } else if (prop.images && typeof prop.images === 'object') {
                    prop.propertyDetails.images = Object.values(prop.images).filter(img => typeof img === 'string');
                } else {
                    prop.propertyDetails.images = [];
                }
                
                changed = true;
            }
            
            if (prop.nftData) {
                prop.propertyDetails.NftMinted = prop.nftData.NftMinted || "Yes";
                prop.propertyDetails.images = [prop.nftData.qrCodeUrl]; // Just for visibility of old properties
                changed = true;
            }
            
            if (changed) {
                await prop.save();
                propUpdates++;
            }
        }
        console.log(`Normalized ${propUpdates} Properties.`);

        console.log("--- Process Complete ---");
        mongoose.connection.close();
    } catch (err) {
        console.error("Migration script error: ", err);
        process.exit(1);
    }
}

normalizeData();
