import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"; // 🟢 EKLENDİ: Backend bağlantısı için şart

const firebaseConfig = {
  apiKey: "nonpubliccod",
  authDomain: "pattty-7adff.firebaseapp.com",
  projectId: "pattty-7adff",
  storageBucket: "pattty-7adff.firebasestorage.app",
  messagingSenderId: "a",
  appId: "a9"
};

// 1. Uygulamayı başlat ve 'export' kelimesini başına ekle (Named Export)
export const app = initializeApp(firebaseConfig);

// 2. Diğer servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 3. 🟢 Functions servisini başlat ve dışa aktar (AI fonksiyonları için gerekli)
export const functions = getFunctions(app);