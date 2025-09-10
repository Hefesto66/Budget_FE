// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, type FirestoreError } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate that the project ID is set
if (!firebaseConfig.projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local file. This is required for Firebase to work correctly.");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db)
        .catch((err: FirestoreError) => {
            if (err.code === 'failed-precondition') {
                console.warn(
                    'Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a a time.'
                );
            } else if (err.code === 'unimplemented') {
                console.warn(
                    'Firestore persistence failed: The current browser does not support all of the features required to enable persistence.'
                );
            }
        });
} catch (error) {
    console.error("Error enabling Firestore persistence:", error);
}

export { db };
