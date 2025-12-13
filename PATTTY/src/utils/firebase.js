// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDI-Y6Cb3dA-1spIQGCAcZYmAWVXRngNrE",
  authDomain: "pattty-7adff.firebaseapp.com",
  projectId: "pattty-7adff",
  storageBucket: "pattty-7adff.firebasestorage.app",
  messagingSenderId: "968501519468",
  appId: "1:968501519468:web:c481a9c15e3aed44106449"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Veritabanı bağlantımız