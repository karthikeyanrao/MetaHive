const admin = require('firebase-admin');

// Note: Ensure the firebaseServiceAccount.json file is added to the backend root directory before running.
// You can download it from Firebase Console -> Project Settings -> Service Accounts.
// For now, we wrap the initialization in a try/catch so the server doesn't crash if the file is missing during setup.

try {
  let serviceAccount = null;
  
  try {
     serviceAccount = require('../firebaseServiceAccount.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully.');
  } catch (err) {
      console.warn('⚠️  firebaseServiceAccount.json not found. Firebase Auth middleware is running in permissive/mock mode until the file is added.');
  }

} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // If the admin sdk isn't initialized due to missing json, we error out OR mock for testing based on your preference.
    // In production, we strictly require a valid token.
    if (admin.apps.length === 0) {
        return res.status(500).json({ error: 'Server misconfiguration: Firebase Admin not initialized (missing JSON)' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Add the decoded token to the request, contains uid, email, etc.
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = verifyToken;
