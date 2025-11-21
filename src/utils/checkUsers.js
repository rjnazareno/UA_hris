// Quick utility to check existing users
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const listAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email,
        name: userData.name,
        employeeId: userData.employeeId,
        role: userData.role,
        department: userData.department
      });
    });
    
    console.log('=== ALL USERS IN DATABASE ===');
    users.forEach(user => {
      console.log(`
Email: ${user.email}
Name: ${user.name}
Employee ID: ${user.employeeId}
Role: ${user.role}
Department: ${user.department}
---
      `);
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
