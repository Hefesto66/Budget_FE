
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, type Firestore, type FirestoreError } from "firebase/firestore";

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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Conditionally initialize Firebase only if the project ID is available
if (firebaseConfig.projectId && typeof window !== 'undefined') {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);

        // Enable offline persistence
        enableIndexedDbPersistence(db)
            .catch((err: FirestoreError) => {
                if (err.code === 'failed-precondition') {
                    console.warn(
                        'Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.'
                    );
                } else if (err.code === 'unimplemented') {
                    console.warn(
                        'Firestore persistence failed: The current browser does not support all of the features required to enable persistence.'
                    );
                }
            });
    } catch(e) {
        console.error("Firebase initialization error:", e);
        // Reset to null if initialization fails
        app = null;
        db = null;
    }
} else if (typeof window !== 'undefined') {
    console.warn("Firebase config is missing or incomplete (projectId is required). App will run in a data-less mode. Please check your .env.local file.");
}


export { db };
