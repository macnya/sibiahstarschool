
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Log environment variable directly at the module scope for debugging
if (typeof window !== 'undefined') {
  // This log runs only on the client-side
  // console.log("CLIENT DEBUG: NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  // console.log("CLIENT DEBUG: typeof NEXT_PUBLIC_FIREBASE_API_KEY:", typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
} else {
  // This log runs only on the server-side during module initialization
  console.log("SERVER DEBUG (initial evaluation): NEXT_PUBLIC_FIREBASE_API_KEY (from firebase.ts):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

export { app, auth };
