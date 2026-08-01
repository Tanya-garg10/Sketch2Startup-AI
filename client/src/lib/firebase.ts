import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "",
}

function initFirebase(): FirebaseApp {
  try {
    if (getApps().length > 0) return getApp()
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Firebase config incomplete — using demo placeholder.")
      return initializeApp({ apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo" })
    }
    return initializeApp(firebaseConfig)
  } catch (err) {
    console.error("Firebase init error:", err)
    return initializeApp({ apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo" })
  }
}

export const firebaseApp = initFirebase()
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseStorage = getStorage(firebaseApp)
