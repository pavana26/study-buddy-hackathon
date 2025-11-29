// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAKyDV44EJNXzhpka1SbvibDdGD2Bu5eQc",
  authDomain: "study-buddy-hackathon-3aaf8.firebaseapp.com",
  databaseURL: "https://study-buddy-hackathon-3aaf8-default-rtdb.firebaseio.com",
  projectId: "study-buddy-hackathon-3aaf8",
  storageBucket: "study-buddy-hackathon-3aaf8.firebasestorage.app",
  messagingSenderId: "483946000232",
  appId: "1:483946000232:web:21970cfcf5188fccc870dd",
  measurementId: "G-XRFV3CSH00"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);  
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'  
});