// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB594rQOY9H-TGlXK2WgCK_wob9FF8Pu7Y",
  authDomain: "smart-factory-simulator.firebaseapp.com",
  projectId: "smart-factory-simulator",
  storageBucket: "smart-factory-simulator.firebasestorage.app",
  messagingSenderId: "947689751995",
  appId: "1:947689751995:web:2bd216346e04935246f09e",
  measurementId: "G-R7D2L338CG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
