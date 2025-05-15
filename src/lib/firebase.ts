
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Log environment variable directly at the module scope for debugging
if (typeof window !== 'undefined') {
  // console.log("CLIENT DEBUG: NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  // console.log("CLIENT DEBUG: typeof NEXT_PUBLIC_FIREBASE_API_KEY:", typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
} else {
  // console.log("SERVER DEBUG (initial evaluation): NEXT_PUBLIC_FIREBASE_API_KEY (from firebase.ts):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Check if the essential API key is present and is a non-empty string
// This check is primarily for early warning; Firebase init will also fail if key is truly invalid.
if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
  const context = typeof window !== 'undefined' ? 'Client' : 'Server';
  console.error(`(${context} Context) Firebase API Key Error: The API key is missing, empty, or not a string.
Ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in your .env.local file.
After saving .env.local, YOU MUST RESTART your Next.js development server.
Value received for apiKey: '${apiKey}' (Type: ${typeof apiKey})`);
  // Not throwing an error here, as previous logs confirmed the key is usually present.
  // If Firebase init fails due to the key, it will throw its own more specific error.
}

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
