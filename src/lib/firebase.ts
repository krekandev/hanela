import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hanela-cukraren.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hanela-cukraren",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hanela-cukraren.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const apiKeyEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";

export const isFirebaseConfigured = Boolean(
  apiKeyEnv !== "" &&
  !apiKeyEnv.includes("your-api-key") &&
  !apiKeyEnv.includes("placeholder") &&
  apiKeyEnv !== "undefined" &&
  apiKeyEnv !== "null"
);

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  hasApiKey: boolean;
  projectId: string;
  authDomain: string;
}

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const rawKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";
  return {
    isConfigured: isFirebaseConfigured,
    hasApiKey: Boolean(rawKey !== ""),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hanela-cukraren",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hanela-cukraren.firebaseapp.com",
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
    } catch (error) {
      console.warn("[Firebase] Client initialization failed, operating in fallback mode:", error);
      app = null;
      db = null;
      auth = null;
      googleProvider = null;
    }
  } else if (process.env.NODE_ENV === "development") {
    console.info("[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is not set. Operating in local offline fallback mode.");
  }
}

export { app, db, auth, googleProvider };
