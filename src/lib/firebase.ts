
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Log environment variable directly at the module scope
if (typeof window !== 'undefined') {
  console.log("CLIENT DEBUG: NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log("CLIENT DEBUG: typeof NEXT_PUBLIC_FIREBASE_API_KEY:", typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
} else {
  console.log("SERVER DEBUG (initial evaluation): NEXT_PUBLIC_FIREBASE_API_KEY (from firebase.ts):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (typeof window === 'undefined') {
  // This log appears in your SERVER terminal right before the check
  console.log("SERVER DEBUG (pre-check): Value of 'apiKey' variable:", apiKey);
  console.log("SERVER DEBUG (pre-check): Type of 'apiKey' variable:", typeof apiKey);
}

// Check if the essential API key is present and is a non-empty string
if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
  const context = typeof window !== 'undefined' ? 'Client' : 'Server';
  const errorPrefix = `(${context} Context) Firebase API Key Error:`;
  const errorMessage = `${errorPrefix} The API key is missing, empty, or not a string.
Ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in your .env.local file.
After saving .env.local, YOU MUST RESTART your Next.js development server.
Value received for apiKey: '${apiKey}' (Type: ${typeof apiKey})`;
  
  // We log the error, but don't throw, to see if Firebase itself throws a more specific error
  // if the key is truly invalid for the project, rather than just missing from env.
  console.error(errorMessage);
  // Not throwing the error here anymore as logs confirm the key is usually present.
  // If Firebase init fails, it will throw its own error.
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
