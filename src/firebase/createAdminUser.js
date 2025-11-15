// Script to create admin user account in Firebase
// Run this with: node src/firebase/createAdminUser.js

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTpGkwJB_BIy9hCdHrpkTpeq6QNI3FQRA",
  authDomain: "nova-bb1b1.firebaseapp.com",
  projectId: "nova-bb1b1",
  storageBucket: "nova-bb1b1.firebasestorage.app",
  messagingSenderId: "447069618156",
  appId: "1:447069618156:web:ec1e266291d3a979e54ac9",
  measurementId: "G-8MSWEQ13K0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = "resty.nazareno@novahr.com";
  const password = "Admin123!"; // Change this to a secure password
  
  try {
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ User account created:", user.uid);
    
    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      name: "Resty Nazareno",
      employeeId: "EMP001",
      department: "Administration",
      position: "System Administrator",
      role: "admin", // This is the key field for admin access
      createdAt: new Date().toISOString(),
    });
    
    console.log("✅ User profile created in Firestore");
    console.log("\n📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("👤 Name: Resty Nazareno");
    console.log("🎯 Role: admin");
    console.log("\nYou can now login with these credentials!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }
}

createAdminUser();
