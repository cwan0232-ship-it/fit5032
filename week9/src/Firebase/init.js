import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const configured = Object.values(firebaseConfig).every(Boolean)
const app = configured ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null
export default db
