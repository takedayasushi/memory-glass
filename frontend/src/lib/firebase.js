import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "memory-glass-2026",
  appId: "1:1070316946738:web:3af586acf0bf2ef541032b",
  storageBucket: "memory-glass-2026.firebasestorage.app",
  apiKey: "AIzaSyA6El6c5MWo0jx5f54MRh3WonhO_B1lXPw",
  authDomain: "memory-glass-2026.firebaseapp.com",
  messagingSenderId: "1070316946738",
  measurementId: "G-WVYLP6QZD6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
