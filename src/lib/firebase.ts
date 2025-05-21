
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  type UserCredential,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignInWithEmailPassword,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let firebaseConfigUsed: any = null;

console.log("firebase.ts: Module loaded.");

if (typeof window === 'undefined') {
  // SERVER-SIDE (e.g., App Hosting runtime, Next.js server components/routes)
  console.log("firebase.ts: Running on server.");
  const serverEnvConfig = process.env.FIREBASE_WEBAPP_CONFIG;

  if (serverEnvConfig && serverEnvConfig.trim() !== "") {
    console.log("SERVER RUNTIME: FIREBASE_WEBAPP_CONFIG found, attempting to parse.");
    try {
      firebaseConfigUsed = JSON.parse(serverEnvConfig);
      console.log("SERVER RUNTIME: FIREBASE_WEBAPP_CONFIG parsed successfully. API Key present:", !!firebaseConfigUsed.apiKey);
      if (!firebaseConfigUsed.apiKey) {
        console.error("SERVER RUNTIME CRITICAL: FIREBASE_WEBAPP_CONFIG parsed but apiKey is missing. Config:", JSON.stringify(firebaseConfigUsed));
        firebaseConfigUsed = null; // Invalidate if API key is missing
      }
    } catch (e: any) {
      console.error("SERVER RUNTIME CRITICAL: Failed to parse FIREBASE_WEBAPP_CONFIG. Error:", e.message, "Received value:", serverEnvConfig);
      firebaseConfigUsed = null; // Invalidate on parse error
    }
  } else {
    console.warn("SERVER RUNTIME WARNING: FIREBASE_WEBAPP_CONFIG environment variable is not set or is empty. Firebase client SDK might not initialize correctly on the server for certain use cases (e.g. if you were intending to use it for server-side auth with client SDK).");
    // For server-side Firebase Admin SDK usage (e.g., in Cloud Functions), FIREBASE_CONFIG is used, not FIREBASE_WEBAPP_CONFIG.
    // This path is more relevant if trying to use client SDK for server-side auth, which is less common.
    firebaseConfigUsed = null;
  }
  // Fallback if FIREBASE_WEBAPP_CONFIG was not used or failed (e.g. for local SSR dev where it might not be set)
  // However, for App Hosting, FIREBASE_WEBAPP_CONFIG should be the primary source.
  if (!firebaseConfigUsed) {
    console.log("SERVER RUNTIME (Fallback or Local Dev): Attempting to use NEXT_PUBLIC_ variables for Firebase initialization.");
     firebaseConfigUsed = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    };
    console.log("SERVER RUNTIME (Fallback or Local Dev): Using NEXT_PUBLIC_ variables. API Key present:", !!firebaseConfigUsed.apiKey);
  }

} else {
  // CLIENT-SIDE
  console.log("firebase.ts: Running on client.");
  firebaseConfigUsed = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  };
  console.log("CLIENT-SIDE: Using NEXT_PUBLIC_ variables. API Key present:", !!firebaseConfigUsed.apiKey);
}

// Initialize Firebase if config is valid
if (firebaseConfigUsed && firebaseConfigUsed.apiKey && firebaseConfigUsed.apiKey.trim() !== "") {
  console.log("Firebase config seems valid, attempting initialization with config. API Key snippet:", firebaseConfigUsed.apiKey ? firebaseConfigUsed.apiKey.substring(0, 10) + "..." : "MISSING/EMPTY");
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfigUsed);
      console.log("Firebase app initialized successfully via initializeApp. App instance:", app ? "defined" : "undefined");
    } else {
      app = getApp();
      console.log("Firebase app already initialized, getting existing app via getApp(). App instance:", app ? "defined" : "undefined");
    }
  } catch (error) {
    console.error("CRITICAL: Firebase initializeApp() failed:", error);
    app = undefined;
  }

  if (app) {
    try {
      auth = getAuth(app);
      console.log("Firebase Auth initialized successfully. Auth instance:", auth ? "defined" : "undefined");
    } catch (error) {
      console.error("CRITICAL: Firebase getAuth() failed:", error);
      auth = undefined;
    }
  } else {
    console.error("CRITICAL: Firebase app object is undefined after initialization attempt. Firebase Auth cannot be initialized.");
    auth = undefined;
  }
} else {
  console.error("CRITICAL: Firebase configuration is missing or API key is undefined/empty. Firebase cannot be initialized. API Key from config used:", firebaseConfigUsed?.apiKey);
  app = undefined;
  auth = undefined;
}

const googleProvider = new GoogleAuthProvider();

const createUserWithEmailPassword = (email: string, pass: string): Promise<UserCredential> => {
  console.log("createUserWithEmailPassword called. App defined?", !!app, "Auth defined?", !!auth);
  if (!auth) {
    console.error("Auth is not initialized (createUserWithEmailPassword). Config used at init:", firebaseConfigUsed);
    return Promise.reject(new Error("Authentication service not available. Firebase Auth may not have initialized correctly."));
  }
  return fbCreateUserWithEmailAndPassword(auth, email, pass);
};

const signInWithEmailPassword = (email: string, pass: string): Promise<UserCredential> => {
  console.log("signInWithEmailPassword called. App defined?", !!app, "Auth defined?", !!auth);
  if (!auth) {
    console.error("Auth is not initialized (signInWithEmailPassword). Config used at init:", firebaseConfigUsed);
    return Promise.reject(new Error("Authentication service not available. Firebase Auth may not have initialized correctly."));
  }
  return fbSignInWithEmailAndPassword(auth, email, pass);
};

const signInWithGoogle = (): Promise<UserCredential> => {
  console.log("signInWithGoogle called. App defined?", !!app, "Auth defined?", !!auth);
  if (!auth) {
    console.error("Auth is not initialized (signInWithGoogle). Config used at init:", firebaseConfigUsed);
    return Promise.reject(new Error("Authentication service not available. Firebase Auth may not have initialized correctly."));
  }
  return fbSignInWithPopup(auth, googleProvider);
};

const signOut = (): Promise<void> => {
  console.log("signOut called. App defined?", !!app, "Auth defined?", !!auth);
  if (!auth) {
    console.error("Auth is not initialized (signOut). Config used at init:", firebaseConfigUsed);
    return Promise.reject(new Error("Authentication service not available. Firebase Auth may not have initialized correctly."));
  }
  return fbSignOut(auth);
};

const handleAuthStateChange = (callback: (user: any) => void) => {
  console.log("handleAuthStateChange setup. App defined?", !!app, "Auth defined?", !!auth);
  if (!auth) {
    console.warn("Auth is not initialized for handleAuthStateChange. Calling callback with null. Config used at init:", firebaseConfigUsed);
    if (typeof callback === 'function') {
      callback(null);
    }
    // Return a no-op unsubscribe function
    return () => { console.warn("Unsubscribe called on uninitialized auth for handleAuthStateChange."); };
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
  type UserCredential,
  getAdditionalUserInfo
};
