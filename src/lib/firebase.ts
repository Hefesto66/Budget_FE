
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Client-side check for Firebase configuration
if (typeof window !== 'undefined' && !firebaseConfig.projectId) {
    const errorMessage = "Firebase configuration is missing. Please create a .env.local file with your Firebase project credentials. You can use .env.example as a template.";
    console.error(errorMessage);
    // You might want to display this error in the UI as well
    if (document.body) {
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif; background-color: #ffebee; color: #b71c1c;"><h2>Configuration Error</h2><p>${errorMessage}</p></div>`;
    }
    throw new Error(errorMessage);
}


let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Create a Promise that resolves with the db instance once persistence is enabled.
const dbReady: Promise<Firestore | null> = new Promise((resolve) => {
  if (typeof window !== 'undefined' && firebaseConfig.projectId) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      
      // Initialize Auth
      auth = getAuth(app);
      
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log("Firestore persistence enabled.");
          resolve(db);
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: multiple tabs open. App will still function.');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: browser does not support this feature. App will still function.');
          } else {
            console.error("Firestore persistence error:", err);
          }
          // Resolve with the db instance anyway, allowing online-only mode.
          resolve(db); 
        });
    } catch (e) {
      console.error("Firebase initialization error", e);
      resolve(null);
    }
  } else {
    // If in SSR or no projectId, resolve with null.
    resolve(null);
  }
});

// Export the app instance, auth, and the promise for the db instance.
export { app, db, auth, dbReady };

