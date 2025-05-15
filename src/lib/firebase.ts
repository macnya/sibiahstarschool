
'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// !!! DEBUGGING LOG !!!
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_API_KEY as seen by firebase.ts:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// You should see your API key printed in the server console (terminal where `npm run dev` runs)
// If it's undefined or empty, the .env.local file is not being loaded correctly or the variable is misspelled.

// Check if the essential API key is present
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.trim() === "") {
  console.error("Firebase API Key is missing or empty in environment variables.");
  throw new Error(
    "Firebase API Key is missing or empty. Critical step: Please ensure that NEXT_PUBLIC_FIREBASE_API_KEY is correctly set with your actual API key in the .env.local file (located in the root of your project). After saving changes to .env.local, you MUST restart your Next.js development server for the new environment variables to be loaded."
  );
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

export { app, auth };
