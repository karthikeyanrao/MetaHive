// src/context/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";    
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAE9q1M8ha4UVIRS1s7IZlOVYLI35DNkgc",
  authDomain: "metahive-7444a.firebaseapp.com",
  projectId: "metahive-7444a",
  storageBucket: "metahive-7444a.firebasestorage.app",
  messagingSenderId: "60653267335",
  appId: "1:60653267335:web:55523670008bfacad68b22",
  measurementId: "G-7QYFT59JM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };