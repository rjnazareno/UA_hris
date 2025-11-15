// Firestore Database Service for Time Logs and Requests
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

// ============= TIME LOGS =============

// Log time in
export const logTimeIn = async (userId, userData) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const timeLogId = `${userId}_${today}`;
    
    const timeLogData = {
      userId,
      userName: userData.name,
      employeeId: userData.employeeId,
      date: today,
      timeIn: new Date().toISOString(),
      timeOut: null,
      status: 'active',
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, "timeLogs", timeLogId), timeLogData);
    return { success: true, data: timeLogData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Log time out
export const logTimeOut = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeLogId = `${userId}_${today}`;
    
    await updateDoc(doc(db, "timeLogs", timeLogId), {
      timeOut: new Date().toISOString(),
      status: 'completed',
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get today's time log for a user
export const getTodayTimeLog = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeLogId = `${userId}_${today}`;
    
    const timeLogDoc = await getDoc(doc(db, "timeLogs", timeLogId));
    
    if (timeLogDoc.exists()) {
      return { success: true, data: timeLogDoc.data() };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get time logs for a user (last 30 days)
export const getUserTimeLogs = async (userId, limit = 30) => {
  try {
    const q = query(
      collection(db, "timeLogs"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const timeLogs = [];
    querySnapshot.forEach((doc) => {
      timeLogs.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: timeLogs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============= LEAVE REQUESTS =============

// Submit leave request
export const submitLeaveRequest = async (userId, userData, leaveData) => {
  try {
    const leaveRef = doc(collection(db, "leaveRequests"));
    
    const leaveRequest = {
      id: leaveRef.id,
      userId,
      userName: userData.name,
      employeeId: userData.employeeId,
      type: leaveData.type,
      from: leaveData.from,
      to: leaveData.to,
      days: leaveData.days,
      reason: leaveData.reason || "",
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await setDoc(leaveRef, leaveRequest);
    return { success: true, data: leaveRequest };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get leave requests (for admin)
export const getLeaveRequests = async (status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, "leaveRequests"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "leaveRequests"),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update leave request status
export const updateLeaveStatus = async (requestId, status, adminNote = "") => {
  try {
    await updateDoc(doc(db, "leaveRequests", requestId), {
      status,
      adminNote,
      processedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============= TIME ADJUSTMENT REQUESTS =============

// Submit time adjustment request
export const submitTimeAdjustment = async (userId, userData, adjustmentData) => {
  try {
    const adjustmentRef = doc(collection(db, "timeAdjustments"));
    
    const adjustment = {
      id: adjustmentRef.id,
      userId,
      userName: userData.name,
      employeeId: userData.employeeId,
      date: adjustmentData.date,
      original: adjustmentData.original,
      requested: adjustmentData.requested,
      reason: adjustmentData.reason,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await setDoc(adjustmentRef, adjustment);
    return { success: true, data: adjustment };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get time adjustment requests (for admin)
export const getTimeAdjustments = async (status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, "timeAdjustments"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "timeAdjustments"),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    const adjustments = [];
    querySnapshot.forEach((doc) => {
      adjustments.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: adjustments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update time adjustment status
export const updateTimeAdjustmentStatus = async (adjustmentId, status, adminNote = "") => {
  try {
    await updateDoc(doc(db, "timeAdjustments", adjustmentId), {
      status,
      adminNote,
      processedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============= OVERTIME REQUESTS =============

// Submit overtime request
export const submitOvertimeRequest = async (userId, userData, overtimeData) => {
  try {
    const overtimeRef = doc(collection(db, "overtimeRequests"));
    
    const overtime = {
      id: overtimeRef.id,
      userId,
      userName: userData.name,
      employeeId: userData.employeeId,
      date: overtimeData.date,
      hours: overtimeData.hours,
      reason: overtimeData.reason,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await setDoc(overtimeRef, overtime);
    return { success: true, data: overtime };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get overtime requests (for admin)
export const getOvertimeRequests = async (status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, "overtimeRequests"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "overtimeRequests"),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update overtime request status
export const updateOvertimeStatus = async (requestId, status, adminNote = "") => {
  try {
    await updateDoc(doc(db, "overtimeRequests", requestId), {
      status,
      adminNote,
      processedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============= ACTIVITIES (Recent Activities) =============

// Add activity log
export const addActivity = async (userId, activityData) => {
  try {
    const activityRef = doc(collection(db, "activities"));
    
    const activity = {
      id: activityRef.id,
      userId,
      type: activityData.type, // 'time_in', 'time_out', 'leave_request', etc.
      description: activityData.description,
      timestamp: Timestamp.now(),
    };

    await setDoc(activityRef, activity);
    return { success: true, data: activity };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user activities
export const getUserActivities = async (userId, limit = 10) => {
  try {
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: activities.slice(0, limit) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
