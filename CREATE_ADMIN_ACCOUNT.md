# Creating Admin Account for Resty Nazareno

## Quick Method: Using Firebase Console (RECOMMENDED)

Follow these steps to create your admin account:

### Step 1: Create Authentication Account
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "Nova" project
3. Click **"Authentication"** in the left menu
4. Click **"Users"** tab
5. Click **"Add user"** button
6. Enter:
   - **Email**: `resty.nazareno@novahr.com`
   - **Password**: `Admin123!` (or choose your own secure password)
7. Click **"Add user"**
8. **Copy the User UID** that appears (you'll need it in the next step)

### Step 2: Create User Profile in Firestore
1. Stay in Firebase Console
2. Click **"Firestore Database"** in the left menu
3. Click **"Start collection"** (or go to the `users` collection if it exists)
4. For **Collection ID**, type: `users`
5. Click **"Next"**
6. For **Document ID**, paste the **User UID** you copied from Step 1
7. Add these fields:

```
Field Name         |  Type    |  Value
-------------------|----------|----------------------------------
uid                | string   | (paste the User UID)
email              | string   | resty.nazareno@novahr.com
name               | string   | Resty Nazareno
employeeId         | string   | EMP001
department         | string   | Administration
position           | string   | System Administrator
role               | string   | admin
createdAt          | string   | 2025-11-16T00:00:00.000Z
```

8. Click **"Save"**

### Step 3: Test Your Account
1. Go to your app: http://localhost:5174
2. Login with:
   - Email: `resty.nazareno@novahr.com`
   - Password: `![1763225089523](image/CREATE_ADMIN_ACCOUNT/1763225089523.png)` (or whatever you set)
3. You should now see **"Switch to Admin"** in the dropdown menu!
4. Click it to access the Admin Dashboard

---

## Alternative Method: Using Node Script

If you prefer to run a script:

```bash
node src/firebase/createAdminUser.js
```

This will automatically create the account with:
- Email: resty.nazareno@novahr.com
- Password: Admin123!
- Role: admin

---

## How Role-Based Access Works

✅ **Admin Users** (`role: "admin"`):
- Can see "Switch to Admin" option in dropdown
- Can access `/admin` route
- Can access Employee Dashboard (`/home`)
- Can approve/reject requests

✅ **Regular Employees** (`role: "employee"`):
- Cannot see "Switch to Admin" option
- Cannot access `/admin` route (will redirect to `/home`)
- Can only access Employee Dashboard
- Can submit requests

## To Add More Admin Users

For any employee to become an admin:
1. Go to Firestore Database
2. Find their user document in the `users` collection
3. Change the `role` field from `"employee"` to `"admin"`
4. They will see the "Switch to Admin" option on their next login!

---

## Security Features Implemented

✅ Role check in UI (shows/hides menu options)
✅ Role check in ProtectedRoute (blocks unauthorized access)
✅ Admin route requires `role: "admin"`
✅ Non-admin users redirected to `/home` if they try to access `/admin`

Happy testing! 🎉
