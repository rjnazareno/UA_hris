import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

export const fixAdminAccount = async () => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Find the admin user (the one with role: admin but no email)
    let adminUid = null;
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role === 'admin' && !data.email) {
        adminUid = doc.id;
      }
    });

    if (!adminUid) {
      console.log('No admin account found to fix');
      return { success: false, error: 'No admin found' };
    }

    // Update the admin account with proper data
    await updateDoc(doc(db, 'users', adminUid), {
      email: 'resty.nazareno@novahr.com',
      name: 'Resty Nazareno',
      employeeId: 'EMP001',
      department: 'Administration',
      position: 'System Administrator',
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Admin account fixed successfully!');
    console.log('Email: resty.nazareno@novahr.com');
    console.log('Use this email to login');
    
    return { success: true };
  } catch (error) {
    console.error('Error fixing admin account:', error);
    return { success: false, error: error.message };
  }
};
