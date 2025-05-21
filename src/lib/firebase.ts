
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
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

// Determine Firebase configuration
if (typeof window === 'undefined' && process.env.FIREBASE_WEBAPP_CONFIG) {
  // Server-side in an environment that provides FIREBASE_WEBAPP_CONFIG (like App Hosting)
  try {
    firebaseConfigUsed = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    console.log("SERVER RUNTIME (App Hosting): Attempting to use FIREBASE_WEBAPP_CONFIG for Firebase initialization.");
    if (!firebaseConfigUsed.apiKey) {
        console.error("SERVER RUNTIME (App Hosting): FIREBASE_WEBAPP_CONFIG was parsed but apiKey is missing. Config:", JSON.stringify(firebaseConfigUsed));
        firebaseConfigUsed = null; // Force fallback
    } else {
        console.log("SERVER RUNTIME (App Hosting): Successfully parsed FIREBASE_WEBAPP_CONFIG:", JSON.stringify(firebaseConfigUsed));
    }
  } catch (e) {
    console.error("SERVER RUNTIME (App Hosting): Failed to parse FIREBASE_WEBAPP_CONFIG. Falling back. Error:", e);
    firebaseConfigUsed = null; // Ensure fallback on parse error
  }
}

if (!firebaseConfigUsed) {
  // Client-side, or server-side local dev (using .env.local), or server-side App Hosting fallback
  const configFromNextPublic = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  };
  firebaseConfigUsed = configFromNextPublic;
  if (typeof window !== 'undefined') {
    // This will only run in the browser
    console.log("CLIENT-SIDE: Using NEXT_PUBLIC_ variables for Firebase initialization.");
  } else {
    // This will run on the server during local dev or if FIREBASE_WEBAPP_CONFIG failed
    console.log("SERVER RUNTIME (Fallback or Local Dev): Using NEXT_PUBLIC_ variables for Firebase initialization.");
  }
}

// Initialize Firebase if config is valid
if (firebaseConfigUsed && firebaseConfigUsed.apiKey) {
  console.log("Attempting Firebase initialization with config:", JSON.stringify(firebaseConfigUsed));
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
    app = undefined; // Ensure app is undefined on error
  }

  if (app) {
    try {
      auth = getAuth(app);
      console.log("Firebase Auth initialized successfully.");
    } catch (error) {
      console.error("Firebase getAuth() error:", error);
      auth = undefined; // Ensure auth is undefined on error
    }
  } else {
    console.error("Firebase app object is undefined after initializeApp attempt. Auth cannot be initialized.");
  }
} else {
  console.error("CRITICAL FAILURE: Firebase configuration is missing or API key is undefined after all attempts. Firebase cannot be initialized.");
}

const googleProvider = new GoogleAuthProvider();

// Wrapper functions to check if auth is initialized
const ensureAuthInitialized = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: Parameters<T>): ReturnType<T> | Promise<never> => {
    if (!auth) {
      console.error("Auth is not initialized in ensureAuthInitialized. Firebase might not have been configured correctly or environment variables are missing at runtime. Check server logs for details.");
      return Promise.reject(new Error("Authentication service not available due to Firebase initialization failure."));
    }
    return fn(auth, ...args.slice(1)); // Pass auth as the first argument to Firebase SDK functions
  }) as T;
};


// Note: The Firebase SDK functions like fbCreateUserWithEmailAndPassword expect `auth` as their first argument.
// The ensureAuthInitialized wrapper needs to correctly pass it.
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

const signInWithGoogle = () => {
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
    console.warn("Auth is not initialized for handleAuthStateChange. Calling callback with null. Check server logs for Firebase initialization errors.");
    if (typeof callback === 'function') {
      callback(null);
    }
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

export {
  app, // Can be undefined
  auth, // Can be undefined
  createUserWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
  signOut,
  handleAuthStateChange,
  GoogleAuthProvider
};
