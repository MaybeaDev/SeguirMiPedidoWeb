// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Si usas Firestore
import { getAuth } from "firebase/auth"; // Si usas Authentication
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD0bToBunqEnq38bya1jRhxG7Xv4i41ctU",
  authDomain: "seguirmipedido.firebaseapp.com",
  projectId: "seguirmipedido",
  storageBucket: "seguirmipedido.firebasestorage.app",
  messagingSenderId: "239961774858",
  appId: "1:239961774858:web:7010dc447e688aeff3b8f3",
};

const app = initializeApp(firebaseConfig);

// Exporta los servicios que necesitas
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
