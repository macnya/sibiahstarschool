
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

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Log the config that will be used for initialization, crucial for server-side runtime debugging.
if (typeof window === 'undefined') { // Indicates server-side or build-time
  console.log("SERVER RUNTIME/BUILD: Firebase Config for Initialization:", JSON.stringify(firebaseConfigValues));
  if (!firebaseConfigValues.apiKey || firebaseConfigValues.apiKey.trim() === "") {
    console.error("SERVER RUNTIME/BUILD CRITICAL: Firebase API Key is missing or empty at runtime before initialization attempt.");
  }
}

try {
  if (!getApps().length) {
    // Ensure all required config values are present before attempting to initialize
    if (firebaseConfigValues.apiKey && firebaseConfigValues.projectId) {
      app = initializeApp(firebaseConfigValues);
      console.log("Firebase app initialized successfully via initializeApp.");
    } else {
      console.error("Firebase app initialization skipped due to missing API key or Project ID.");
    }
  } else {
    app = getApp();
    console.log("Firebase app already initialized, getting existing app via getApp().");
  }
} catch (error) {
  console.error("Firebase initializeApp() error:", error);
  // app remains undefined
}

if (app) {
  try {
    auth = getAuth(app);
    console.log("Firebase Auth initialized successfully.");
  } catch (error) {
    console.error("Firebase getAuth() error:", error);
    // auth remains undefined
  }
} else {
  console.error("Firebase app object is undefined after initialization attempt. Auth cannot be initialized.");
}

const googleProvider = new GoogleAuthProvider();

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
    console.warn("Auth is not initialized for handleAuthStateChange. Calling callback with null.");
    // This ensures AuthProvider doesn't hang indefinitely if auth fails to init.
    // It will treat it as "no user logged in".
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
