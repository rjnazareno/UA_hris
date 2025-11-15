// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTpGkwJB_BIy9hCdHrpkTpeq6QNI3FQRA",
  authDomain: "nova-bb1b1.firebaseapp.com",
  projectId: "nova-bb1b1",
  storageBucket: "nova-bb1b1.firebasestorage.app",
  messagingSenderId: "447069618156",
  appId: "1:447069618156:web:ec1e266291d3a979e54ac9",
  measurementId: "G-8MSWEQ13K0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
