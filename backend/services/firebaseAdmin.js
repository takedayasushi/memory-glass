const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
// being set to the path of the service account key JSON file,
// or using Firebase CLI's default credentials.
admin.initializeApp({
  projectId: "memory-glass-2026",
});

const db = admin.firestore();

module.exports = { admin, db };
