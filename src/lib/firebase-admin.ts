// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Service account credentials from environment variables
const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The replace is crucial for parsing the private key from an environment variable
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let db: Firestore;

if (!admin.apps.length) {
  try {
    // Check if all required service account properties are available
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        db = getFirestore();
        console.log("Firebase Admin SDK initialized successfully.");
    } else {
        console.warn("Firebase Admin credentials are not fully set in environment variables. Admin SDK not initialized.");
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
  }
} else {
  // If the app is already initialized, just get the firestore instance
  db = getFirestore(admin.apps[0]!);
}

// Export a promise that resolves with the db instance
const adminDbReady: Promise<Firestore | null> = new Promise((resolve) => {
    if (db) {
        resolve(db);
    } else {
        // If db is not initialized, wait a moment in case initialization is in progress, then resolve
        setTimeout(() => resolve(db || null), 500);
    }
});


export { admin, adminDbReady };
