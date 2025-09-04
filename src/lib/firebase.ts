// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAAygjQg1kjpg8Jt_RQfmSSyBFpwOlOmMo",
  authDomain: "xinmu2.firebaseapp.com",
  projectId: "xinmu2",
  storageBucket: "xinmu2.firebasestorage.app",
  messagingSenderId: "704243943469",
  appId: "1:704243943469:web:a8a3f2bb497dd7a510d0a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create and export Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Confirm it's working
console.log("✅ Firebase initialized");