# Firebase Setup Instructions

## Your NovaHR HRIS is now connected to Firebase! 🎉

### What's Been Set Up:

1. **Firebase Configuration** (`src/firebase/config.js`)
   - Connected to your Firebase project

2. **Authentication Service** (`src/firebase/authService.js`)
   - Sign up new users
   - Sign in existing users
   - Sign out functionality
   - Auto-sync with Firestore user profiles

3. **Database Service** (`src/firebase/dbService.js`)
   - Time logging (Time In/Out with daily reset)
   - Leave requests
   - Time adjustment requests
   - Overtime requests
   - Activity tracking

4. **Updated Components:**
   - `AuthContext` - Now uses Firebase Authentication
   - `Home.jsx` - Connected to real-time data from Firebase
   - `AdminPage.jsx` - Displays actual data from Firestore

---

## How to Create Your First User Account:

### Option 1: Using Firebase Console (Recommended for testing)
1. Go to: https://console.firebase.google.com/
2. Select your project "Nova"
3. Click "Authentication" in the left menu
4. Click "Users" tab
5. Click "Add user" button
6. Enter:
   - **Email**: admin@novahr.com (or any email)
   - **Password**: Test123! (or any password)
7. Click "Add user"

### Option 2: Create a Registration Page (For production)
Your app already has a `register` function in AuthContext. You can:
- Add a registration form to your Login page
- Or create a separate registration page
- Admins can create accounts for employees

---

## Next Steps to Test Your App:

1. **Start your development server:**
   ```bash
   npm start
   ```

2. **Create a test user** (see options above)

3. **Login to your app** with the credentials

4. **Test Time Logging:**
   - Click "Log Time In" button
   - Check Firebase Console → Firestore Database → timeLogs collection
   - You should see a new document with today's date

5. **Test Admin Features:**
   - Go to Firebase Console → Firestore Database
   - Manually add test data to collections, OR
   - The app will show empty states when no data exists

---

## Database Structure:

### Collections Created:
- `users` - Employee profiles (name, email, role, employeeId, etc.)
- `timeLogs` - Daily time in/out records (auto-resets each day)
- `activities` - Recent activity feed
- `leaveRequests` - Leave applications
- `timeAdjustments` - Time adjustment requests
- `overtimeRequests` - Overtime applications

### User Roles:
- `employee` - Regular employee access
- `admin` - Admin dashboard access

---

## Adding Sample Data for Testing:

To test admin features, you can manually add sample data in Firebase Console:

1. Go to Firestore Database
2. Click "Start collection"
3. Add sample leave request:
   ```
   Collection: leaveRequests
   Document ID: (auto-generated)
   Fields:
   - userId: (your user's uid)
   - userName: "John Doe"
   - employeeId: "EMP001"
   - type: "Vacation Leave"
   - from: "2025-11-20"
   - to: "2025-11-25"
   - days: 5
   - reason: "Family vacation"
   - status: "pending"
   - createdAt: (timestamp - use "now")
   ```

---

## Features Now Working:

✅ Firebase Authentication (email/password)
✅ User profiles stored in Firestore
✅ Time In/Out tracking (resets daily)
✅ Activity logging
✅ Admin can approve/reject requests
✅ Real-time data updates
✅ Persistent login sessions

---

## Security Rules (To Add Later):

Currently your Firestore is in "test mode" which allows all reads/writes. 
Before going to production, add security rules to protect your data.

---

## Need Help?

If you encounter any issues:
1. Check Firebase Console for errors
2. Check browser console for error messages
3. Verify user is logged in before testing features
4. Make sure Firestore collections exist

Happy testing! 🚀
