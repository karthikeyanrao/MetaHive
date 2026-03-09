const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const mongoose = require("mongoose");

const firebaseConfig = {
    apiKey: "AIzaSyAE9q1M8ha4UVIRS1s7IZlOVYLI35DNkgc",
    authDomain: "metahive-7444a.firebaseapp.com",
    projectId: "metahive-7444a",
    storageBucket: "metahive-7444a.firebasestorage.app",
    messagingSenderId: "60653267335",
    appId: "1:60653267335:web:55523670008bfacad68b22",
    measurementId: "G-7QYFT59JM5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

mongoose.connect("mongodb+srv://Adminn:MetaHive123@metahive.o7eimep.mongodb.net/test?appName=MetaHive");

// Define Schemas that accept Firebase's string IDs
const Property = mongoose.model("Property", new mongoose.Schema({ _id: String }, { strict: false }));
const User = mongoose.model("User", new mongoose.Schema({ _id: String }, { strict: false }));
const NFT = mongoose.model("NFT", new mongoose.Schema({ _id: String }, { strict: false }), "nft");

async function migrate() {
    try {
        console.log("Migrating Properties...");
        const propSnapshot = await getDocs(collection(db, "properties"));
        for (const docSnap of propSnapshot.docs) {
            await Property.updateOne(
                { _id: docSnap.id },
                { $set: docSnap.data() },
                { upsert: true }
            );
        }
        console.log(`✅ Migrated ${propSnapshot.size} properties.`);

        console.log("Migrating Users...");
        const userSnapshot = await getDocs(collection(db, "Users"));
        for (const docSnap of userSnapshot.docs) {
            await User.updateOne(
                { _id: docSnap.id },
                { $set: docSnap.data() },
                { upsert: true }
            );
        }
        console.log(`✅ Migrated ${userSnapshot.size} users.`);

        console.log("Migrating NFTs...");
        const nftSnapshot = await getDocs(collection(db, "nft_badges"));
        for (const docSnap of nftSnapshot.docs) {
            await NFT.updateOne(
                { _id: docSnap.id },
                { $set: docSnap.data() },
                { upsert: true }
            );
        }
        console.log(`✅ Migrated ${nftSnapshot.size} NFTs.`);

        console.log("🎉 All migrations completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrate();