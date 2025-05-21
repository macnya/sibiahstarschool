
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// Auth related imports are removed as auth functionality is being removed.
// import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | undefined = undefined;
// let auth: Auth | undefined = undefined; // Auth object no longer needed
let firebaseConfigUsed: any = null;

console.log("firebase.ts: Module loaded.");

if (typeof window === 'undefined') {
  // SERVER-SIDE
  console.log("firebase.ts: Running on server.");
  const serverEnvConfig = process.env.FIREBASE_WEBAPP_CONFIG;

  if (serverEnvConfig && serverEnvConfig.trim() !== "") {
    console.log("SERVER RUNTIME: FIREBASE_WEBAPP_CONFIG found, attempting to parse.");
    try {
      firebaseConfigUsed = JSON.parse(serverEnvConfig);
      if (!firebaseConfigUsed.apiKey || firebaseConfigUsed.apiKey.trim() === "") {
        console.error("SERVER RUNTIME CRITICAL: FIREBASE_WEBAPP_CONFIG parsed but apiKey is missing or empty. Config:", JSON.stringify(firebaseConfigUsed));
        firebaseConfigUsed = null; 
      } else {
        console.log("SERVER RUNTIME: FIREBASE_WEBAPP_CONFIG parsed successfully. API Key present:", !!firebaseConfigUsed.apiKey);
      }
    } catch (e: any) {
      console.error("SERVER RUNTIME CRITICAL: Failed to parse FIREBASE_WEBAPP_CONFIG. Error:", e.message, "Received value:", serverEnvConfig);
      firebaseConfigUsed = null; 
    }
  } else {
    console.warn("SERVER RUNTIME WARNING: FIREBASE_WEBAPP_CONFIG environment variable is not set or is empty.");
  }
  
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
  console.log("Firebase config seems valid, attempting initialization with apiKey snippet:", firebaseConfigUsed.apiKey ? firebaseConfigUsed.apiKey.substring(0, 10) + "..." : "MISSING/EMPTY");
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfigUsed);
      console.log("Firebase app initialized successfully via initializeApp. App instance:", app ? "defined" : "undefined");
    } else {
      app = getApp();
      console.log("Firebase app already initialized, getting existing app via getApp(). App instance:", app ? "defined" : "undefined");
    }
  } catch (error: any) {
    console.error("CRITICAL: Firebase initializeApp() failed:", error.message ? error.message : error);
    app = undefined;
  }

  // Auth initialization is removed as auth features are being removed.
  // if (app) {
  //   try {
  //     auth = getAuth(app);
  //     console.log("Firebase Auth initialized successfully. Auth instance:", auth ? "defined" : "undefined");
  //   } catch (error: any) {
  //     console.error("CRITICAL: Firebase getAuth() failed:", error.message ? error.message : error);
  //     auth = undefined;
  //   }
  // } else {
  //   console.error("CRITICAL: Firebase app object is undefined after initialization attempt. Firebase Auth cannot be initialized.");
  //   auth = undefined;
  // }
} else {
  console.error("CRITICAL: Firebase configuration is missing or API key is undefined/empty. Firebase cannot be initialized. Config used:", firebaseConfigUsed);
  app = undefined;
  // auth = undefined;
}

// Auth specific functions are removed.
// const googleProvider = new GoogleAuthProvider();
// export { createUserWithEmailPassword, signInWithEmailPassword, signInWithGoogle, signOut, handleAuthStateChange, GoogleAuthProvider, type UserCredential, getAdditionalUserInfo };

export { app }; // Export only the app instance if needed for other Firebase services.
