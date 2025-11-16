// Employee Management Service for Firebase
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query, 
  orderBy,
  updateDoc,
  deleteDoc,
  where
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./config";

// Get all employees
export const getAllEmployees = async () => {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const employees = [];
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: employees };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new employee (creates both auth account and firestore profile)
export const addEmployee = async (employeeData, adminEmail, adminPassword) => {
  try {
    const { email, password, name, employeeId, department, position, role } = employeeData;

    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      email: email,
      name: name,
      employeeId: employeeId,
      department: department || "",
      position: position || "",
      role: role || "employee",
      createdAt: new Date().toISOString(),
    });

    // Sign back in as admin to maintain the admin session
    if (adminEmail && adminPassword) {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    }

    return { 
      success: true, 
      data: { 
        id: userId, 
        email, 
        name, 
        employeeId, 
        department, 
        position, 
        role 
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update employee profile
export const updateEmployee = async (userId, updates) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete employee (only removes from Firestore, not from Auth)
export const deleteEmployee = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get employee by ID
export const getEmployeeById = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "users", userId));
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: "Employee not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Search employees by name or employee ID
export const searchEmployees = async (searchTerm) => {
  try {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    
    const employees = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        employees.push({ id: doc.id, ...data });
      }
    });

    return { success: true, data: employees };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
