
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

// Log environment variable directly at the module scope for debugging
if (typeof window === 'undefined') {
  // This log runs only on the server-side during module initialization
  console.log("SERVER DEBUG (initial evaluation): NEXT_PUBLIC_FIREBASE_API_KEY (from firebase.ts):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Corrected as per previous step
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Wrapper functions to be used by AuthProvider or directly
const createUserWithEmailPassword = (email: string, pass: string) => {
  return fbCreateUserWithEmailAndPassword(auth, email, pass);
};

const signInWithEmailPassword = (email: string, pass: string) => {
  return fbSignInWithEmailAndPassword(auth, email, pass);
};

const signInWithGoogle = () => {
  return fbSignInWithPopup(auth, googleProvider);
};

const signOut = () => {
  return fbSignOut(auth);
};

const handleAuthStateChange = (callback: (user: any) => void) => {
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
  GoogleAuthProvider // Export if needed directly, though usually used within signInWithGoogle
};
