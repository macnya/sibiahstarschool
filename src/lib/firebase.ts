
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  type UserCredential, // Added UserCredential
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let firebaseConfigUsed: any = null;

const serverEnvConfig = process.env.FIREBASE_WEBAPP_CONFIG;
const clientEnvApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Determine Firebase configuration
if (typeof window === 'undefined' && serverEnvConfig) {
  // Server-side in an environment that provides FIREBASE_WEBAPP_CONFIG (like App Hosting)
  try {
    firebaseConfigUsed = JSON.parse(serverEnvConfig);
    console.log("SERVER RUNTIME (App Hosting): Attempting to use FIREBASE_WEBAPP_CONFIG for Firebase initialization.");
    if (!firebaseConfigUsed.apiKey) {
        console.error("SERVER RUNTIME (App Hosting): FIREBASE_WEBAPP_CONFIG was parsed but apiKey is missing. Config:", JSON.stringify(firebaseConfigUsed));
        firebaseConfigUsed = null; // Force fallback
    } else {
        console.log("SERVER RUNTIME (App Hosting): Successfully parsed FIREBASE_WEBAPP_CONFIG.");
    }
  } catch (e) {
    console.error("SERVER RUNTIME (App Hosting): Failed to parse FIREBASE_WEBAPP_CONFIG. Falling back. Error:", e);
    firebaseConfigUsed = null; // Ensure fallback on parse error
  }
}

if (!firebaseConfigUsed) {
  // Client-side, or server-side local dev (using .env.local), or server-side App Hosting fallback
  const configFromNextPublic = {
    apiKey: clientEnvApiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  };
  firebaseConfigUsed = configFromNextPublic;
  if (typeof window !== 'undefined') {
    console.log("CLIENT-SIDE: Using NEXT_PUBLIC_ variables for Firebase initialization.");
  } else {
    console.log("SERVER RUNTIME (Fallback or Local Dev): Using NEXT_PUBLIC_ variables for Firebase initialization.");
  }
}

// Initialize Firebase if config is valid
if (firebaseConfigUsed && firebaseConfigUsed.apiKey && firebaseConfigUsed.apiKey.trim() !== "") {
  console.log("Firebase config seems valid, attempting initialization with apiKey:", firebaseConfigUsed.apiKey ? ' vorhanden' : 'fehlt');
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfigUsed);
      console.log("Firebase app initialized successfully via initializeApp.");
    } else {
      app = getApp();
      console.log("Firebase app already initialized, getting existing app via getApp().");
    }
  } catch (error) {
    console.error("Firebase initializeApp() error:", error);
    app = undefined;
  }

  if (app) {
    try {
      auth = getAuth(app);
      console.log("Firebase Auth initialized successfully.");
    } catch (error) {
      console.error("Firebase getAuth() error:", error);
      auth = undefined;
    }
  } else {
    console.error("SERVER RUNTIME/BUILD CRITICAL: Firebase app object is undefined. Firebase Auth cannot be initialized. API Key from config:", firebaseConfigUsed.apiKey);
  }
} else {
  console.error("SERVER RUNTIME/BUILD CRITICAL: Firebase configuration is missing or API key is undefined/empty. Firebase cannot be initialized. API Key from config:", firebaseConfigUsed?.apiKey);
  // To prevent app crashes if auth is used before this error is seen by devs,
  // we don't throw here directly but auth will remain undefined.
}


const googleProvider = new GoogleAuthProvider();

// Note: The Firebase SDK functions like fbCreateUserWithEmailAndPassword expect `auth` as their first argument.
const createUserWithEmailPassword = (email: string, pass: string) => {
  if (!auth) {
    console.error("Auth is not initialized (createUserWithEmailPassword).");
    return Promise.reject(new Error("Authentication service not available."));
  }
  return fbCreateUserWithEmailAndPassword(auth, email, pass);
};

const signInWithEmailPassword = (email: string, pass: string) => {
  if (!auth) {
    console.error("Auth is not initialized (signInWithEmailPassword).");
    return Promise.reject(new Error("Authentication service not available."));
  }
  return fbSignInWithEmailAndPassword(auth, email, pass);
};

const signInWithGoogle = (): Promise<UserCredential> => {
  if (!auth) {
    console.error("Auth is not initialized (signInWithGoogle).");
    return Promise.reject(new Error("Authentication service not available."));
  }
  return fbSignInWithPopup(auth, googleProvider);
};

const signOut = () => {
  if (!auth) {
    console.error("Auth is not initialized (signOut).");
    return Promise.reject(new Error("Authentication service not available."));
  }
  return fbSignOut(auth);
};

const handleAuthStateChange = (callback: (user: any) => void) => {
  if (!auth) {
    console.warn("Auth is not initialized for handleAuthStateChange. Calling callback with null.");
    if (typeof callback === 'function') {
      callback(null);
    }
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

export {
  app, 
  auth, 
  createUserWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
  signOut,
  handleAuthStateChange,
  GoogleAuthProvider,
  type UserCredential
};
