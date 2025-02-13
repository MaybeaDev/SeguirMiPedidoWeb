import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyD0bToBunqEnq38bya1jRhxG7Xv4i41ctU",
  authDomain: "seguirmipedido.firebaseapp.com",
  projectId: "seguirmipedido",
  storageBucket: "seguirmipedido.firebasestorage.app",
  messagingSenderId: "239961774858",
  appId: "1:239961774858:web:7010dc447e688aeff3b8f3",
};

const app = initializeApp(firebaseConfig);

// Configurar Firestore con persistencia local y soporte para múltiples pestañas
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
const db_persistenceFree = getFirestore(app);

const auth = getAuth(app);
const functions = getFunctions(app);

export { db, db_persistenceFree, auth, functions };
