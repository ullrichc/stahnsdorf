import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Offline Persistence — IndexedDB-Cache für Vor-Ort-Nutzung
// Bei Fehler (z.B. multi-tab, browser limitation) funktioniert die App weiter,
// nur ohne offline Cache.
let offlinePersistenceEnabled = false;
let offlinePersistenceFailed = false;

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db)
    .then(() => {
      offlinePersistenceEnabled = true;
    })
    .catch((err) => {
      offlinePersistenceFailed = true;
      console.warn("Offline persistence unavailable:", err.code);
    });
}

export { offlinePersistenceEnabled, offlinePersistenceFailed };
